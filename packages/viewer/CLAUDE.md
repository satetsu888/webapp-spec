# @webapp-spec/viewer

WebAppSpec のブラウザベースビューア。仕様の閲覧と Operation のシミュレーション実行ができる。

## コマンド

```sh
npm run dev       # 開発サーバ起動（Vite）
npm run build     # プロダクションビルド（tsc + vite build）
npm run preview   # ビルド済みファイルのプレビュー
```

## 技術スタック

- React 19 + React Router 7（BrowserRouter）
- Vite 6 + Tailwind CSS 4
- @xyflow/react + elkjs（ダイアグラム描画・自動レイアウト）

## アーキテクチャ

```
src/
  App.tsx                 # ルーター定義、spec ロード/アンロードの状態管理
  main.tsx                # エントリポイント
  samples.ts              # 組み込みサンプル spec の定義
  hooks/
    useSpec.tsx            # spec の読み込み・バリデーション
    useSimulation.tsx      # シミュレーションの状態管理
  engine/
    executor.ts            # Operation 実行ロジック（状態遷移の適用）
    store.ts               # シミュレーション用の Entity インスタンスストア
    types.ts               # ランタイム型定義（SimulationState 等）
  components/
    loading/               # SpecLoader（ファイル選択・サンプル選択）
    layout/                # Layout, Sidebar（ナビゲーション）
    overview/              # Overview ページ（App Map 図、ER 図、SideEffect フロー、Specs サマリー）
    domain/                # Entity, Relation の詳細表示 + State 図
    operations/            # Operation 一覧・詳細
    scenarios/             # Scenario 一覧・詳細
    sideeffects/           # SideEffect フロー図ビルダー
    usecases/              # Actor-Operation 図ビルダー
    ui/                    # View 一覧・詳細
    simulation/            # シミュレーション UI（Actor/Action 選択、入力フォーム、実行結果）
    shared/                # 共通コンポーネント（Badge, RefLink, StateArrow, StateTag, FlowDiagram）
```

## 画面構成

App.tsx は初回マウント時に `/__spec__.json` を fetch する。CLI（`wspec view`）経由で起動した場合はこのエンドポイントから spec が返されるため自動ロードされる。`npm run dev` で単体起動した場合は 404 になり、従来の SpecLoader（ファイル選択・サンプル選択）にフォールバックする。

ロード後は Sidebar + コンテンツ領域のレイアウトに切り替わる。

ルーティング:
- `/` — Overview（App Map 図、ER 図、SideEffect フロー、Specs サマリー）
- `/domain/entities`, `/domain/entities/:id` — Entity 一覧・詳細
- `/domain/relations` — Relation（ER 図）
- `/operations`, `/operations/:id` — Operation 一覧・詳細
- `/views`, `/views/:id` — View 一覧・詳細
- `/scenarios`, `/scenarios/:id` — Scenario 一覧・詳細
- `/simulation` — シミュレーション

## ダイアグラム（xyflow / React Flow）

### アーキテクチャ

ダイアグラムは `@xyflow/react` + `elkjs`（自動レイアウト）で描画する。

```
shared/flow/
  FlowDiagram.tsx          ← 共通ラッパー（レイアウト計算・描画・クリックナビゲーション）
  layout.ts                ← ELK.js レイアウトユーティリティ
  types.ts                 ← FlowData 型（nodes + edges + direction）
  nodes/                   ← カスタムノードコンポーネント
  edges/                   ← カスタムエッジコンポーネント
```

各画面のビルダー関数が `FlowData | null` を返し、`FlowDiagram` コンポーネントで描画する。ビルダーはデータ不足時に `null` を返し、その場合ダイアグラムは非表示になる。

### ダイアグラム一覧

| 画面 | ビルダー | 方向 | 内容 |
|------|----------|------|------|
| Overview | `buildAppMapDiagram` | RIGHT | Actor → View{Component} → Operation → Entity |
| Overview / RelationList | `buildErDiagram` | RIGHT | Entity 間のリレーション（ER図） |
| Overview | `buildSideEffectFlowDiagram` | RIGHT | 全 SideEffect の Operation → 通知先ネットワーク |
| EntityDetail | `buildStateDiagram` | DOWN | Entity の全状態と Transition による遷移 |
| OperationDetail | `buildOperationImpactDiagram` | RIGHT | Actor → Operation → 状態変化 / SideEffect / Follow-up |
| ViewDetail | `buildViewCompositionDiagram` | RIGHT | View の Component 構成 |

### カスタムノード

| ノード型 | 用途 | 視覚 |
|----------|------|------|
| `entitySchema` | ER 図の Entity | テーブル（ヘッダー + フィールド行） |
| `state` | 状態遷移図の状態 | 黒丸（start）/ 二重丸（end）/ 角丸矩形（normal） |
| `actor` | Operation Impact の Actor | 人型 SVG アイコン |
| `operation` | Operation | ピル型（丸角） |
| `labeled` | 汎用ラベル付き矩形 | 矩形（variant="hexagon" で六角風） |
| `group` | サブグラフ相当 | 破線コンテナ |

### カスタムエッジ

| エッジ型 | 用途 |
|----------|------|
| `dashed` | SideEffect / FollowUp への破線接続 |
| `relation` | ER 図のリレーション（カーディナリティ "1" / "*" 表示付き） |

### 共通ルール

- ビルダーは `FlowData` を返す（position は `{ x: 0, y: 0 }` でよい。レイアウトは FlowDiagram が計算）
- クリック可能なノードは `data.href` にパスを設定（FlowDiagram が onNodeClick で React Router 遷移）
- グループノードは `type: "group"` + 子ノードの `parentId` / `extent: "parent"` で表現

## シミュレーションエンジン

Fixture データを初期状態として読み込み、Actor を選択して Operation を実行する。`engine/executor.ts` が Transition の状態遷移を適用し、`engine/store.ts` が Entity インスタンスを管理する。

実行フロー:
1. Fixture 選択 → インスタンスストア初期化
2. Actor 選択 → Actor にバインドされた Entity インスタンスを選択
3. 実行可能な Operation 一覧を表示
4. Operation 選択 → input フォーム表示
5. 実行 → Transition 適用 → ストア更新 → 結果表示

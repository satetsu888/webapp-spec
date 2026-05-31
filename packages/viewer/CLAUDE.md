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
- Mermaid（ER 図・状態遷移図の描画）

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
    domain/                # Entity, Relation, Transition の詳細表示 + Mermaid 図
    specs/                 # Spec 一覧
    actors/                # Actor 一覧
    operations/            # Operation 一覧・詳細
    scenarios/             # Scenario 一覧・詳細
    sideeffects/           # SideEffect 一覧
    ui/                    # View 一覧・詳細
    simulation/            # シミュレーション UI（Actor/Action 選択、入力フォーム、実行結果）
    shared/                # 共通コンポーネント（Badge, MermaidDiagram, RefLink, StateArrow, StateTag）
```

## 画面構成

spec が未ロード時は SpecLoader を表示。ロード後は Sidebar + コンテンツ領域のレイアウトに切り替わる。

ルーティング:
- `/` — SpecLoader（spec 未ロード時）またはリダイレクト
- `/domain/entities`, `/domain/entities/:id` — Entity 一覧・詳細
- `/domain/relations` — Relation 一覧
- `/domain/transitions`, `/domain/transitions/:id` — Transition 一覧・詳細
- `/specs` — Spec 一覧
- `/usecases/actors` — Actor 一覧
- `/usecases/operations`, `/usecases/operations/:id` — Operation 一覧・詳細
- `/usecases/side-effects` — SideEffect 一覧
- `/scenarios`, `/scenarios/:id` — Scenario 一覧・詳細
- `/ui/views`, `/ui/views/:id` — View 一覧・詳細
- `/simulation` — シミュレーション

## Mermaid ダイアグラム

### ダイアグラム一覧

各画面に対応するビルダー関数がダイアグラム文字列を生成し、`MermaidDiagram` コンポーネントで描画する。
ビルダーはデータが不足する場合（changes が空など）に `null` を返し、その場合ダイアグラムは非表示になる。

| 画面 | ビルダー | Mermaid 種別 | 内容 |
|------|----------|-------------|------|
| EntityDetail | `buildStateDiagram` | stateDiagram-v2 | Entity の全状態と Transition による遷移 |
| RelationList | `buildErDiagram` | erDiagram | Entity 間のリレーション |
| TransitionDetail | `buildTransitionDiagram` | stateDiagram-v2 | 単一 Transition の状態変化（Entity ごとにサブグラフ） |
| OperationDetail | `buildOperationImpactDiagram` | flowchart LR | Actor → Operation → 状態変化 / SideEffect / Follow-up |
| ScenarioDetail | `buildScenarioFlowDiagram` | flowchart TD | Scenario のステップフロー |
| SideEffectList | `buildSideEffectFlowDiagram` | flowchart LR | 全 SideEffect の Operation → 通知先ネットワーク |
| ViewDetail | `buildViewCompositionDiagram` | flowchart LR | View の Component 構成 |

### ノード形状ルール

ダイアグラム間で spec オブジェクトの形状を統一する。新しいダイアグラムを追加する際はこのルールに従うこと。

| 概念 | 形状 | Mermaid 構文 |
|------|------|-------------|
| Actor | 人型アイコン | `@{ shape: icon, icon: "spec:actor", label: "..." }` |
| Operation | スタジアム（丸角） | `(["..."])` |
| Entity / 状態変化 | 矩形 | `["..."]` |
| Component | 矩形 | `["..."]` |
| Scenario 参照 | 六角形 | `{{"..."}}` |
| SideEffect | スタジアム + 破線接続 | `(["..."])` + `-.->` |
| View / Variant | subgraph | コンテナとして使用 |

### 共通実装ルール

- `spec:actor` アイコンは `MermaidDiagram.tsx` で `registerIconPacks` により登録済み
- クリック可能なノードには `click nodeId href "/path"` を付与。`MermaidDiagram` が `bindFunctions` + キャプチャフェーズのイベント委譲で React Router 遷移に変換する
- ラベル内の `"` は `#quot;` にエスケープ（`escapeLabel` ヘルパー）
- stateDiagram-v2 のグループノード（`state alias { ... }`）にはラベル（description）を付けられない。`state "label" as alias { ... }` は Mermaid がエラーを出すため、alias のみで定義する

## シミュレーションエンジン

Fixture データを初期状態として読み込み、Actor を選択して Operation を実行する。`engine/executor.ts` が Transition の状態遷移を適用し、`engine/store.ts` が Entity インスタンスを管理する。

実行フロー:
1. Fixture 選択 → インスタンスストア初期化
2. Actor 選択 → Actor にバインドされた Entity インスタンスを選択
3. 実行可能な Operation 一覧を表示
4. Operation 選択 → input フォーム表示
5. 実行 → Transition 適用 → ストア更新 → 結果表示

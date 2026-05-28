# @webapp-spec/viewer

WebAppSpec のブラウザベースビューア。仕様の閲覧と Usecase のシミュレーション実行ができる。

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
    executor.ts            # Usecase 実行ロジック（状態遷移の適用）
    store.ts               # シミュレーション用の Entity インスタンスストア
    types.ts               # ランタイム型定義（SimulationState 等）
  components/
    loading/               # SpecLoader（ファイル選択・サンプル選択）
    layout/                # Layout, Sidebar（ナビゲーション）
    domain/                # Entity, Relation, Transition の詳細表示 + Mermaid 図
    specs/                 # Spec 一覧
    actors/                # Actor 一覧
    usecases/              # Usecase 一覧・詳細
    scenarios/             # Scenario 一覧・詳細
    reactions/             # Reaction 一覧
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
- `/actors` — Actor 一覧
- `/usecases`, `/usecases/:id` — Usecase 一覧・詳細
- `/scenarios`, `/scenarios/:id` — Scenario 一覧・詳細
- `/reactions` — Reaction 一覧
- `/ui/views`, `/ui/views/:id` — View 一覧・詳細
- `/simulation` — シミュレーション

## シミュレーションエンジン

Fixture データを初期状態として読み込み、Actor を選択して Usecase を実行する。`engine/executor.ts` が Transition の状態遷移を適用し、`engine/store.ts` が Entity インスタンスを管理する。

実行フロー:
1. Fixture 選択 → インスタンスストア初期化
2. Actor 選択 → Actor にバインドされた Entity インスタンスを選択
3. 実行可能な Usecase 一覧を表示
4. Usecase 選択 → input フォーム表示
5. 実行 → Transition 適用 → ストア更新 → 結果表示

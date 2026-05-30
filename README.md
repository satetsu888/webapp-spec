# WebAppSpec

Webアプリケーションの「何を作るか」を、機械可読な単一のデータ構造として定義するための仕様です。

## なぜ必要か

アプリケーションの仕様は通常、UIモックアップ・ドメインモデル図・API定義・ビジネスルール表など複数のドキュメントに分散します。それぞれがアプリの一側面しか捉えておらず、全体像を把握するには人間がそれらを頭の中で統合する必要があります。

WebAppSpec はこれらを一つの構造にまとめ、アプリケーションの全体像を一箇所で定義します。

## 想定する用途

- **LLMによる実装** — 定義を渡せばアプリの仕様が一意に決まる。グラフ構造なので、特定の usecase に関連する部分だけを切り出して LLM に渡すこともできる
- **網羅的テスト生成** — Entity の状態遷移や Spec のルールから、正常系・異常系・権限境界のテストケースを機械的に導出する

## 仕様の構造

WebAppSpec は以下のレイヤーで構成されます。

| レイヤー | 役割 |
|---------|------|
| **Domain** | Entity、Relation、状態遷移 — ドメインの構造的事実 |
| **Specs** | プラン制限等の条件付きビジネスルール |
| **Actors** | 認証状態で定義されるユーザー・外部システム |
| **Usecases** | ドメイン操作 |
| **Reactions** | Usecase 実行後の副作用 |
| **Scenarios** | View ベースのユーザーシナリオ |
| **UI** | Component（データ取得・入力・変換・出力）と View（配置・Usecase 接続） |

HTTPメソッドやフレームワーク選定といった実装の詳細には依存しません。REST でも GraphQL でも Server Actions でも、同じ定義から実装できます。

## パッケージ構成

```
webapp-spec/
  webapp_spec.md              # 仕様書本体
  schema/
    webapp-spec.schema.json   # JSON Schema
  samples/                    # サンプル定義ファイル
  packages/
    types/                    # @webapp-spec/types — TypeScript 型定義
    validator/                # @webapp-spec/validator — バリデーター + CLI
    viewer/                   # @webapp-spec/viewer — ブラウザビューア + シミュレーター
```

## 使い方

### 定義ファイルの検証

```sh
npm install
cd packages/types && npx tsc
cd ../validator && npx tsc
npx webapp-spec-validate samples/todo-app.json
```

### ビューアの起動

```sh
cd packages/viewer
npm run dev
```

## サンプル

`samples/` ディレクトリにサンプル定義があります。

- `todo-app.json` — Todoアプリ（フル機能）
- `simple-todo-app.json` — Todoアプリ（簡易版）
- `blog-app.json` — ブログアプリ

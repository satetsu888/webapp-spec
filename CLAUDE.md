# CLAUDE.md

## プロジェクト概要

WebAppSpec — Webアプリケーション自体を機械可読なデータ構造として定義するための仕様。

用途:
- LLMによる実装: 定義を渡せばアプリの仕様が一意に決まる
- 網羅的テスト生成: 定義から正常系・異常系のテストケースを機械的に導出する

## 構成

npm workspaces によるモノレポ。将来 viewer 等のツールを追加する想定。

```
webapp-spec/
  webapp_spec.md              # 仕様の本体（型定義、設計判断、具体例）
  schema/
    webapp-spec.schema.json   # JSON Schema（構造バリデーション）
  samples/                    # サンプル spec ファイル
  packages/
    types/                    # @webapp-spec/types — TypeScript 型定義
    validator/                # @webapp-spec/validator — 意味的バリデーター + CLI
```

## 設計原則

- HTTP やUI実装の詳細に依存しない
- 各レイヤーが自分の責務だけを持ち、知識が正しい場所にある
- ビジネスルール（specs）とドメイン構造（domain）を明確に分離する

## ビルドとテスト

```sh
# 型パッケージのビルド（validator が依存するため先にビルド）
cd packages/types && npx tsc

# validator のビルドとテスト
cd packages/validator && npx tsc && npx vitest run

# CLI でサンプルを検証
npx webapp-spec-validate samples/todo-app.json
```

## WebAppSpec のレイヤー構造

- **Domain** — entities, relations, transitions（世界の構造的事実）
- **Specs** — ビジネスルール（プラン制限等の条件付き制約）
- **Actors** — 認証状態で定義（human + 外部システム）
- **Usecases** — ドメイン操作（エンドポイントではない）。followUps で外部システム連携
- **Reactions** — Usecase 実行後の副作用（通知、ログ、webhook）
- **Journeys** — Actor 視点の複数ステップシナリオ
- **UI** — Components（データ取得 + 入力 + 変換 + 出力）と Views（配置 + Usecase 接続）

## 擬似状態 `_start` / `_end`

Entity の作成・削除を状態遷移で表現するための予約語。Entity の states に定義してはならない。
- `_start` — from にのみ使用可能（作成）
- `_end` — to にのみ使用可能（削除）

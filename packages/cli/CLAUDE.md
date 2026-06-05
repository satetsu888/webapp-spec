# @webapp-spec/cli

WebAppSpec の統合 CLI。`wspec` コマンドでバリデーション、ビューア起動、情報表示、スキーマ出力を行う。

## コマンド

```sh
npx tsc                                # ビルド（types, validator, viewer を先にビルドしておくこと）
npx wspec validate <spec.json>         # spec ファイルのバリデーション
npx wspec view <spec.json>             # ビューアをブラウザで開く
npx wspec view <spec.json> --no-open   # ブラウザを自動で開かない
npx wspec view <spec.json> -p 8080     # ポート指定
npx wspec info <spec.json>             # spec の概要情報を表示
npx wspec schema                       # JSON Schema を stdout に出力
```

## アーキテクチャ

```
src/
  index.ts              # エントリポイント（commander によるコマンド登録）
  commands/
    validate.ts         # validate コマンド（JSON Schema + 意味バリデーション）
    view.ts             # view コマンド（静的サーバー起動 + ブラウザ起動）
    info.ts             # info コマンド（spec の概要情報表示）
    schema.ts           # schema コマンド（JSON Schema 出力）
  lib/
    static-server.ts    # 軽量 HTTP 静的ファイルサーバー（SPA フォールバック対応）
    open-browser.ts     # クロスプラットフォームのブラウザ起動ユーティリティ
```

## 依存関係

- `@webapp-spec/validator` — `validate()` 関数を使用（意味バリデーション）
- `@webapp-spec/viewer` — ビルド済み `dist/` を静的ファイルとして配信
- `ajv` — JSON Schema バリデーション
- `commander` — CLI フレームワーク

## view コマンドの仕組み

Node.js の `http` モジュールで軽量サーバーを起動する。

- `/__spec__.json` → CLI が読み込んだ spec データを JSON で返す
- 静的ファイル → viewer の `dist/` から MIME タイプ付きで配信
- SPA フォールバック → 上記に該当しないパスは `index.html` を返す

viewer 側の `App.tsx` が `/__spec__.json` を fetch して自動ロードする。

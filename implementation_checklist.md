# WebAppSpec 実装決定チェックリスト

WebAppSpec は「何を作るか」を定義する。このドキュメントは「どう作るか」を決めるためのチェックリストである。

2 つのパートに分かれる:

- **Part 1: 質問事項** — 選択肢から回答すれば決まる項目。ヒアリング形式で情報を集める。
- **Part 2: 構造化マッピング** — spec の要素ごとに構造化されたデータとして定義が必要な項目。Part 1 の回答と spec の内容をもとに作成する。

---

# Part 1: 質問事項

各セクションの質問に回答することで、実装の方針が決まる。

## Q1. 技術スタック

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 1.1 | フロントエンドフレームワークは？ | React / Vue / Svelte / SolidJS | |
| 1.2 | バックエンドフレームワーク / ランタイムは？ | Next.js / Express / Hono / Rails | |
| 1.3 | API スタイルは？ | REST / GraphQL / tRPC / Server Actions | |
| 1.4 | DB 製品は？ | PostgreSQL / MySQL / SQLite / MongoDB | |
| 1.5 | ORM / クエリビルダは？ | Prisma / Drizzle / TypeORM / Kysely | |
| 1.6 | パッケージマネージャ / ビルドツールは？ | npm / pnpm / Vite / Turbopack | |

## Q2. データベース規約

spec の全 Entity に横断的に適用するルール。Entity 個別の設定は Part 2 の EntityTableMapping で上書きできる。

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 2.1 | ID の生成方式は？ | uuid-v4 / ulid / auto-increment / nanoid | |
| 2.2 | ID の DB 型は？ | uuid / bigint / varchar(26) | |
| 2.3 | `createdAt` カラムを全テーブルに追加するか？ | yes / no | |
| 2.4 | `updatedAt` カラムを全テーブルに追加するか？ | yes / no | |
| 2.5 | タイムスタンプの DB 型は？ | timestamptz / datetime / bigint | |
| 2.6 | `_end`（削除）の実装は？ | 論理削除 (soft) / 物理削除 (hard) | |
| 2.7 | 論理削除のカラム名は？（soft の場合） | deletedAt / deleted / is_deleted | |
| 2.8 | テーブル名の命名規約は？ | snake_case / PascalCase / camelCase | |
| 2.9 | カラム名の命名規約は？ | snake_case / camelCase | |
| 2.10 | 外部キー制約を DB レベルで張るか？ | yes / no | |

## Q3. 認証 / セッション

spec の `authMethods` は「どの手段で認証するか」を定義している。ここでは認証後のセッション管理など実装上の決定を扱う。

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 3.1 | セッション管理方式は？ | JWT / session-cookie / hybrid | |
| 3.2 | JWT の場合、トークンの保存先は？ | httpOnly Cookie / localStorage / memory | |
| 3.3 | セッションの有効期限は？ | 1h / 24h / 7d / 30d | |
| 3.4 | リフレッシュトークンを使うか？ | yes / no | |
| 3.5 | role の解決方法は？ | DB カラム / JWT claim / role テーブル | |
| 3.6 | 認証情報からユーザーを特定するフィールドは？ | email / sub (OAuth) / user_id | |
| 3.7 | パスワードハッシュアルゴリズムは？ | bcrypt / argon2 / scrypt | |

## Q4. デザイン / UX

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 4.1 | UI コンポーネントライブラリは？ | shadcn / MUI / Chakra UI / Headless UI / 自作 | |
| 4.2 | スタイリング手法は？ | Tailwind CSS / CSS Modules / styled-components | |
| 4.3 | レスポンシブ戦略は？ | モバイルファースト / デスクトップファースト | |
| 4.4 | ローディング状態の表現は？ | スケルトン / スピナー / プログレスバー | |
| 4.5 | 空状態（データ0件）の表現は？ | イラスト + メッセージ / テキストのみ | |
| 4.6 | エラー表示パターンは？ | トースト / インライン / モーダル / バナー | |
| 4.7 | `_end` 遷移時に確認ダイアログを表示するか？ | yes / no | |
| 4.8 | 国際化（i18n）対応の有無と対応言語は？ | なし / 日本語+英語 / ... | |
| 4.9 | アクセシビリティ基準は？ | WCAG 2.1 AA / AAA / なし | |
| 4.10 | ダークモード対応は？ | あり / なし / システム追従 | |

## Q5. セキュリティ

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 5.1 | CORS ポリシーは？ | 同一オリジンのみ / 特定オリジン / 全許可 | |
| 5.2 | CSRF 対策方式は？ | Token / SameSite Cookie / Double Submit | |
| 5.3 | CSP ヘッダを設定するか？ | yes / no | |
| 5.4 | 入力バリデーションライブラリは？ | Zod / Joi / Yup / class-validator | |
| 5.5 | レートリミティングを設けるか？ | yes / no | |
| 5.6 | シークレット管理方式は？ | 環境変数 / Vault / dotenv | |

## Q6. テスト戦略

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 6.1 | テストフレームワークは？ | Vitest / Jest / pytest / RSpec | |
| 6.2 | E2E テストツールは？ | Playwright / Cypress / なし | |
| 6.3 | テスト DB 戦略は？ | テスト専用 DB / インメモリ / トランザクションロールバック | |
| 6.4 | spec の Fixture をどう利用するか？ | シードデータとして投入 / テストケースごとに構築 | |
| 6.5 | Scenario → テストケースの導出方針は？ | 手動 / 自動生成 / ハイブリッド | |

## Q7. インフラ / デプロイ

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 7.1 | ホスティングプラットフォームは？ | Vercel / AWS / GCP / Cloudflare / 自前 | |
| 7.2 | コンテナ化するか？ | Docker / docker-compose / なし | |
| 7.3 | CI/CD パイプラインは？ | GitHub Actions / CircleCI / GitLab CI | |
| 7.4 | 環境はいくつ分けるか？ | dev + prod / dev + staging + prod | |
| 7.5 | CDN を使うか？ | yes / no | |

## Q8. 運用

| # | 質問 | 選択肢の例 | 回答 |
|---|------|-----------|------|
| 8.1 | ログ基盤は？ | 構造化ログ (JSON) / テキストログ | |
| 8.2 | エラー監視サービスは？ | Sentry / Datadog / CloudWatch / なし | |
| 8.3 | Operation 実行の監査ログを残すか？ | yes / no | |
| 8.4 | DB バックアップの頻度は？ | 日次 / 週次 / リアルタイムレプリカ | |
| 8.5 | 論理削除データの保持期間は？ | 30日 / 90日 / 無期限 | |
| 8.6 | プライバシーポリシー / 利用規約は必要か？ | yes / no | |

---

# Part 2: 構造化マッピング

spec の各要素を実装上の構造にマッピングする。Part 1 の回答と spec の内容をもとに、要素ごとに1エントリずつ定義する。

## M1. フィールド型変換ルール

spec のフィールド型を DB 型・TypeScript 型にどう変換するかのグローバルルール。Q2 の DB 規約に基づいて定義する。

```typescript
type FieldTypeRule = {
  specType: string    // spec で使われる型文字列
  dbType: string      // DB のカラム型
  tsType: string      // TypeScript の型
}
```

### 記入例

```json
[
  { "specType": "string",    "dbType": "varchar(255)", "tsType": "string" },
  { "specType": "number",    "dbType": "integer",      "tsType": "number" },
  { "specType": "boolean",   "dbType": "boolean",      "tsType": "boolean" },
  { "specType": "date",      "dbType": "date",         "tsType": "string" },
  { "specType": "datetime",  "dbType": "timestamptz",  "tsType": "string" },
  { "specType": "Entity.id", "dbType": "uuid",         "tsType": "string" }
]
```

---

## M2. Entity → テーブルマッピング

spec の Entity ごとに、DB テーブルへの対応を定義する。Q2 のグローバルルール + M1 の型変換から自動導出できる部分は省略し、差分のみ記述する。

```typescript
type EntityTableMapping = {
  entityId: string        // spec の Entity.id

  tableName: string       // DB テーブル名

  // グローバルルールと異なるカラムのみ記述
  columnOverrides?: {
    fieldName: string     // spec のフィールド名
    columnName?: string   // DB カラム名がフィールド名と異なる場合
    dbType?: string       // M1 の FieldTypeRule と異なる場合
  }[]

  // spec に定義されていないが実装上必要な追加カラム
  additionalColumns?: {
    name: string
    dbType: string
    description: string
  }[]

  // インデックス定義
  indexes: {
    columns: string[]
    unique: boolean
  }[]
}
```

### 記入例（Todo App）

```json
[
  {
    "entityId": "User",
    "tableName": "users",
    "columnOverrides": [
      { "fieldName": "email", "dbType": "varchar(255)" }
    ],
    "additionalColumns": [
      { "name": "password_hash", "dbType": "varchar(255)", "description": "認証用パスワードハッシュ" }
    ],
    "indexes": [
      { "columns": ["email"], "unique": true }
    ]
  },
  {
    "entityId": "Todo",
    "tableName": "todos",
    "indexes": [
      { "columns": ["user_id"], "unique": false },
      { "columns": ["user_id", "completion", "availability"], "unique": false }
    ]
  }
]
```

---

## M3. Operation → エンドポイントマッピング

spec の Operation ごとに、HTTP エンドポイントへの対応を定義する。

`"actor.id"` 型の input はサーバー側でセッションから解決するため、pathParams / queryParams / requestBody のいずれにも含めない。

```typescript
type EndpointMapping = {
  operationId: string       // spec の Operation.id

  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string              // URL パス（例: "/api/todos/:todoId/complete"）

  // input のどのフィールドをどこに配置するか
  pathParams?: string[]     // パスパラメータに入れる input フィールド
  queryParams?: string[]    // クエリパラメータに入れる input フィールド（主に GET）
  requestBody?: string[]    // リクエストボディに入れる input フィールド

  successStatus: number     // 200 | 201 | 204

  // spec の ErrorCase → HTTP ステータスコード
  errorMapping: {
    when: string            // ErrorCase.when
    status: number          // HTTP ステータスコード
  }[]
}
```

### 記入例（Todo App）

```json
[
  {
    "operationId": "register-user",
    "method": "POST",
    "path": "/api/users",
    "requestBody": ["name", "email"],
    "successStatus": 201,
    "errorMapping": [
      { "when": "email_taken", "status": 409 }
    ]
  },
  {
    "operationId": "deactivate-user",
    "method": "DELETE",
    "path": "/api/users/me",
    "successStatus": 204,
    "errorMapping": []
  },
  {
    "operationId": "create-todo",
    "method": "POST",
    "path": "/api/todos",
    "requestBody": ["title", "description", "dueDate"],
    "successStatus": 201,
    "errorMapping": []
  },
  {
    "operationId": "complete-todo",
    "method": "PATCH",
    "path": "/api/todos/:todoId/complete",
    "pathParams": ["todoId"],
    "successStatus": 200,
    "errorMapping": [
      { "when": "already_completed", "status": 409 }
    ]
  },
  {
    "operationId": "reopen-todo",
    "method": "PATCH",
    "path": "/api/todos/:todoId/reopen",
    "pathParams": ["todoId"],
    "successStatus": 200,
    "errorMapping": [
      { "when": "not_completed", "status": 409 }
    ]
  },
  {
    "operationId": "delete-todo",
    "method": "DELETE",
    "path": "/api/todos/:todoId",
    "pathParams": ["todoId"],
    "successStatus": 204,
    "errorMapping": []
  }
]
```

### 参照系エンドポイント

spec の Operation は状態変更操作が中心だが、実装では参照系エンドポイントも必要になる。Component の `sources` から導出できる:

```typescript
type ReadEndpoint = {
  derivedFrom: string       // Component.id
  method: "GET"
  path: string
  queryParams?: string[]    // フィルタ・ページネーション・ソートのパラメータ
  successStatus: 200
}
```

```json
[
  {
    "derivedFrom": "todo-list",
    "method": "GET",
    "path": "/api/todos",
    "queryParams": ["page", "limit"],
    "successStatus": 200
  },
  {
    "derivedFrom": "completed-todo-list",
    "method": "GET",
    "path": "/api/todos/completed",
    "queryParams": ["page", "limit"],
    "successStatus": 200
  },
  {
    "derivedFrom": "account-settings",
    "method": "GET",
    "path": "/api/users/me",
    "successStatus": 200
  }
]
```

---

## M4. View → ルートマッピング

spec の View ごとに、フロントエンドのルーティングを定義する。

```typescript
type ViewRouteMapping = {
  viewId: string            // spec の View.id

  // 表示形式
  type: "page" | "modal" | "drawer" | "panel"

  // page の場合の URL パス（modal/drawer は path を持たない場合がある）
  path?: string
  pathParams?: string[]     // URL 中の動的セグメント

  // modal/drawer の場合、どの page 上に表示されるか
  parentView?: string

  // レイアウトグループ（ヘッダー・サイドバー等の共有）
  layout?: string
}
```

### 記入例（Todo App）

```json
[
  {
    "viewId": "register-page",
    "type": "page",
    "path": "/register",
    "layout": "public"
  },
  {
    "viewId": "todo-dashboard",
    "type": "page",
    "path": "/dashboard",
    "layout": "authenticated"
  },
  {
    "viewId": "account-settings-page",
    "type": "page",
    "path": "/settings",
    "layout": "authenticated"
  }
]
```

---

## M5. SideEffect → 配信設定マッピング

spec の SideEffect ごとに、通知の配信方式を定義する。

```typescript
type SideEffectDeliveryMapping = {
  // spec の SideEffect を特定する情報
  trigger: {
    operation: string       // Operation.id
    entity: string          // Entity.id
  }

  // 配信チャネル
  channel: string           // "email" | "push" | "in-app" | "sms" | "webhook" | "log"

  // 処理方式
  processing: "sync" | "async"

  // 非同期の場合のキュー設定
  queue?: {
    provider: string        // "bullmq" | "sqs" | "cloud-tasks"
    retryMax: number
    retryBackoff: "fixed" | "exponential"
  }

  // 配信プロバイダ
  provider?: string         // "sendgrid" | "ses" | "resend" | "fcm" | "internal"

  // メールテンプレート等の識別子
  templateId?: string
}
```

### 記入例

Todo App の spec には sideEffects が定義されていないが、仮に「TODO完了時にオーナーに通知」がある場合:

```json
{
  "trigger": { "operation": "complete-todo", "entity": "Todo" },
  "channel": "email",
  "processing": "async",
  "queue": {
    "provider": "bullmq",
    "retryMax": 3,
    "retryBackoff": "exponential"
  },
  "provider": "sendgrid",
  "templateId": "todo-completed"
}
```

---

## M6. 外部システム連携マッピング

spec で外部システムの Actor（webhook 送信元等）が定義されている場合、その連携の実装方式を定義する。Operation の `followUps` がある場合もここで対応を記述する。

```typescript
type ExternalSystemMapping = {
  actorId: string             // spec の外部 Actor.id

  provider: string            // 連携先サービス名（"stripe", "sendgrid" 等）

  // 外部 → アプリへの受信設定（Webhook）
  inbound: {
    endpoint: string          // Webhook 受信 URL
    authMethod: string        // "signature-header" | "api-key" | "basic-auth" | "ip-whitelist"
    secretEnvVar: string      // 検証用シークレットの環境変数名

    // 外部イベント → spec の Operation への対応
    eventMapping: {
      externalEvent: string   // 外部サービスのイベント名
      operationId: string     // spec の Operation.id
    }[]
  }

  // アプリ → 外部への送信設定（API コール）
  outbound?: {
    baseUrl: string
    authMethod: string        // "api-key" | "oauth" | "basic-auth"
    secretEnvVar: string
  }
}
```

### 記入例

Todo App には外部 Actor がないが、仮に決済連携がある場合:

```json
{
  "actorId": "stripe",
  "provider": "Stripe",
  "inbound": {
    "endpoint": "/webhooks/stripe",
    "authMethod": "signature-header",
    "secretEnvVar": "STRIPE_WEBHOOK_SECRET",
    "eventMapping": [
      { "externalEvent": "payment_intent.succeeded", "operationId": "payment-succeeded" },
      { "externalEvent": "payment_intent.payment_failed", "operationId": "payment-failed" }
    ]
  },
  "outbound": {
    "baseUrl": "https://api.stripe.com/v1",
    "authMethod": "api-key",
    "secretEnvVar": "STRIPE_SECRET_KEY"
  }
}
```

# WebAppSpec 実装決定チェックリスト

WebAppSpec は「何を作るか」を定義する。このドキュメントは「どう作るか」— spec から実装に至るまでに決めるべきことの全量リストである。

構造化フォーマットが決まる項目は TypeScript 型で定義し、自由選択の項目はチェックリストで列挙する。上から順に埋めていけば、全ての決定が完了する。

## 全体構造

```typescript
type ImplementationDecisions = {
  specRef: string                            // 対象の spec ファイル
  techStack: TechStack                       // §1 技術スタック
  database: DatabaseConventions              // §2 DB 共通ルール
  entityMappings: EntityTableMapping[]       // §3 Entity → テーブル
  actorAuth: ActorAuthImplMapping[]           // §4 Actor → 認証実装設定
  endpoints: EndpointMapping[]               // §5 Usecase → エンドポイント
  routes: ViewRouteMapping[]                 // §6 View → ルート
  reactionDelivery: ReactionDeliveryMapping[] // §7 Reaction → 配信設定
  externalSystems: ExternalSystemMapping[]   // §8 外部システム連携
  // §9〜§13 はフリーフォーム（チェックリスト）
}
```

---

## §1 技術スタック

- [ ] フロントエンドフレームワーク（React / Vue / Svelte / SolidJS / ...）
- [ ] バックエンドフレームワーク / ランタイム（Next.js / Express / Hono / Rails / ...）
- [ ] API スタイル（REST / GraphQL / tRPC / Server Actions）
- [ ] DB 製品（PostgreSQL / MySQL / SQLite / MongoDB / ...）
- [ ] ORM / クエリビルダ（Prisma / Drizzle / TypeORM / Kysely / ...）
- [ ] パッケージマネージャ / ビルドツール

---

## §2 データベース共通ルール

spec の全 Entity に横断的に適用するデータベース規約。Entity 個別のオーバーライドは §3 で定義する。

```typescript
type DatabaseConventions = {
  // ID
  idStrategy: string    // "uuid-v4" | "ulid" | "auto-increment" | "nanoid"
  idDbType: string      // "uuid" | "bigint" | "varchar(26)"

  // タイムスタンプ
  timestamps: {
    createdAt: boolean
    updatedAt: boolean
    dbType: string      // "timestamptz" | "datetime" | "bigint"
  }

  // _end（削除）の実装方法
  deletion: {
    strategy: "soft" | "hard"
    softDeleteField?: string  // soft の場合のカラム名（例: "deletedAt"）
  }

  // 命名規約
  naming: {
    table: "snake_case" | "PascalCase" | "camelCase"
    column: "snake_case" | "camelCase"
  }

  // 外部キー制約を DB レベルで張るか
  foreignKeys: boolean

  // spec の型文字列 → DB 型 + TypeScript 型
  fieldTypeMapping: FieldTypeRule[]
}

type FieldTypeRule = {
  specType: string    // spec で使われる型文字列
  dbType: string      // DB のカラム型
  tsType: string      // TypeScript の型
}
```

### 記入例（Todo App）

```json
{
  "idStrategy": "uuid-v4",
  "idDbType": "uuid",
  "timestamps": {
    "createdAt": true,
    "updatedAt": true,
    "dbType": "timestamptz"
  },
  "deletion": {
    "strategy": "soft",
    "softDeleteField": "deletedAt"
  },
  "naming": {
    "table": "snake_case",
    "column": "snake_case"
  },
  "foreignKeys": true,
  "fieldTypeMapping": [
    { "specType": "string",      "dbType": "varchar(255)", "tsType": "string" },
    { "specType": "number",      "dbType": "integer",      "tsType": "number" },
    { "specType": "boolean",     "dbType": "boolean",      "tsType": "boolean" },
    { "specType": "date",        "dbType": "date",         "tsType": "string" },
    { "specType": "datetime",    "dbType": "timestamptz",  "tsType": "string" },
    { "specType": "Entity.id",   "dbType": "uuid",         "tsType": "string" }
  ]
}
```

---

## §3 Entity → テーブルマッピング

spec の Entity ごとに、DB テーブルへの対応を定義する。§2 のグローバルルールから導出できるカラムは省略し、差分のみ記述する。

```typescript
type EntityTableMapping = {
  entityId: string        // spec の Entity.id

  tableName: string       // DB テーブル名

  // グローバルルールと異なるカラムのみ記述
  columnOverrides?: {
    fieldName: string     // spec のフィールド名
    columnName?: string   // DB カラム名がフィールド名と異なる場合
    dbType?: string       // グローバル FieldTypeRule と異なる場合
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
    "columnOverrides": [],
    "indexes": [
      { "columns": ["user_id"], "unique": false },
      { "columns": ["user_id", "completion", "availability"], "unique": false }
    ]
  }
]
```

---

## §4 Actor → 認証実装マッピング

spec の Actor ごとに、認証の実装方式を定義する。認証手段（`authMethods`）は spec 側で定義済みのため、ここでは実装固有の設定のみを扱う。

```typescript
type ActorAuthImplMapping = {
  actorId: string           // spec の Actor.id

  // セッション管理方式
  sessionStrategy: string   // "jwt" | "session-cookie" | "api-key-header"
                            // | "signature-verification"

  // role の解決方法
  roleResolution: string    // "db-column" | "jwt-claim" | "role-table" | "static"

  // 認証情報からエンティティを特定する方法（spec の entity バインディングの実装）
  identifierField?: string  // "email" | "sub" (OAuth) 等
}
```

### 記入例（Todo App）

```json
[
  {
    "actorId": "anonymous",
    "sessionStrategy": "none",
    "roleResolution": "static"
  },
  {
    "actorId": "member",
    "sessionStrategy": "session-cookie",
    "roleResolution": "db-column",
    "identifierField": "email"
  }
]
```

---

## §5 Usecase → エンドポイントマッピング

spec の Usecase ごとに、HTTP エンドポイントへの対応を定義する。1 usecase が複数エンドポイントに対応する場合や、参照系（transition を持たない）usecase が追加される場合もある。

```typescript
type EndpointMapping = {
  usecaseId: string         // spec の Usecase.id

  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string              // URL パス（例: "/api/todos/:todoId/complete"）

  // input のどのフィールドをどこに配置するか
  pathParams?: string[]     // パスパラメータに入れる input フィールド
  queryParams?: string[]    // クエリパラメータに入れる input フィールド（主に GET）
  requestBody?: string[]    // リクエストボディに入れる input フィールド

  // "actor.id" 型の input はサーバー側でセッションから解決するため、
  // pathParams/queryParams/requestBody のいずれにも含めない

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
    "usecaseId": "register-user",
    "method": "POST",
    "path": "/api/users",
    "requestBody": ["name", "email"],
    "successStatus": 201,
    "errorMapping": [
      { "when": "email_taken", "status": 409 }
    ]
  },
  {
    "usecaseId": "deactivate-user",
    "method": "DELETE",
    "path": "/api/users/me",
    "successStatus": 204,
    "errorMapping": []
  },
  {
    "usecaseId": "create-todo",
    "method": "POST",
    "path": "/api/todos",
    "requestBody": ["title", "description", "dueDate"],
    "successStatus": 201,
    "errorMapping": []
  },
  {
    "usecaseId": "complete-todo",
    "method": "PATCH",
    "path": "/api/todos/:todoId/complete",
    "pathParams": ["todoId"],
    "successStatus": 200,
    "errorMapping": [
      { "when": "already_completed", "status": 409 }
    ]
  },
  {
    "usecaseId": "reopen-todo",
    "method": "PATCH",
    "path": "/api/todos/:todoId/reopen",
    "pathParams": ["todoId"],
    "successStatus": 200,
    "errorMapping": [
      { "when": "not_completed", "status": 409 }
    ]
  },
  {
    "usecaseId": "delete-todo",
    "method": "DELETE",
    "path": "/api/todos/:todoId",
    "pathParams": ["todoId"],
    "successStatus": 204,
    "errorMapping": []
  }
]
```

### 参照系エンドポイント

spec の Usecase は状態変更操作が中心だが、実装では参照系エンドポイントも必要になる。Component の `sources` から導出できる:

```typescript
// Component の DataSource から導出される参照系エンドポイント
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

## §6 View → ルートマッピング

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

## §7 Reaction → 配信設定マッピング

spec の Reaction ごとに、通知の配信方式を定義する。

```typescript
type ReactionDeliveryMapping = {
  // spec の Reaction を特定する情報
  trigger: {
    usecase: string         // Usecase.id
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

Todo App の spec には reactions が定義されていないが、仮に「TODO完了時にオーナーに通知」がある場合:

```json
{
  "trigger": { "usecase": "complete-todo", "entity": "Todo" },
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

## §8 外部システム連携マッピング

spec で外部システムの Actor（webhook 送信元等）が定義されている場合、その連携の実装方式を定義する。Usecase の `followUps` がある場合もここで対応を記述する。

```typescript
type ExternalSystemMapping = {
  actorId: string             // spec の外部 Actor.id

  provider: string            // 連携先サービス名（"stripe", "sendgrid" 等）

  // 外部 → アプリへの受信設定（Webhook）
  inbound: {
    endpoint: string          // Webhook 受信 URL
    authMethod: string        // "signature-header" | "api-key" | "basic-auth" | "ip-whitelist"
    secretEnvVar: string      // 検証用シークレットの環境変数名

    // 外部イベント → spec の Usecase への対応
    eventMapping: {
      externalEvent: string   // 外部サービスのイベント名
      usecaseId: string       // spec の Usecase.id
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
      { "externalEvent": "payment_intent.succeeded", "usecaseId": "payment-succeeded" },
      { "externalEvent": "payment_intent.payment_failed", "usecaseId": "payment-failed" }
    ]
  },
  "outbound": {
    "baseUrl": "https://api.stripe.com/v1",
    "authMethod": "api-key",
    "secretEnvVar": "STRIPE_SECRET_KEY"
  }
}
```

---

## §9 デザイン / UX

- [ ] UI コンポーネントライブラリ（shadcn / MUI / Chakra UI / Headless UI / 自作）
- [ ] スタイリング手法（Tailwind CSS / CSS Modules / styled-components / vanilla CSS）
- [ ] レスポンシブ戦略（モバイルファースト / デスクトップファースト / ブレークポイント定義）
- [ ] ローディング状態の表現（スケルトン / スピナー / プログレスバー）
- [ ] 空状態の表現（データ0件時の画面）
- [ ] エラー表示パターン（トースト / インライン / モーダル / バナー）
- [ ] 確認ダイアログの方針（`_end` 遷移の usecase で表示するか、どのような文言か）
- [ ] 国際化（i18n）対応の有無と対応言語
- [ ] アクセシビリティ基準（WCAG 2.1 AA / AAA）
- [ ] フォント選定
- [ ] カラーテーマ / ダークモード対応

---

## §10 セキュリティ

- [ ] CORS ポリシー（許可オリジンの設定）
- [ ] CSRF 対策方式（Token / SameSite Cookie / Double Submit）
- [ ] CSP ヘッダ設定
- [ ] XSS 対策方針（サニタイズライブラリ、エスケープ方針）
- [ ] 入力バリデーション方針（バリデーションライブラリ、サーバー側 / クライアント側の役割分担）
- [ ] レートリミティング（エンドポイント別の制限値）
- [ ] パスワードハッシュアルゴリズム（bcrypt / argon2 / scrypt）
- [ ] シークレット管理方式（環境変数 / Vault / dotenv）
- [ ] セッション管理（有効期限、リフレッシュ方式、並行セッション制限）

---

## §11 テスト戦略

- [ ] テストフレームワーク（Vitest / Jest / pytest / RSpec / ...）
- [ ] E2E テストツール（Playwright / Cypress / ...）
- [ ] テスト DB 戦略（テスト専用 DB / インメモリ / トランザクションロールバック）
- [ ] Fixture の利用方法（spec の Fixture をシードデータとしてどう取り込むか）
- [ ] Scenario → テストケースの導出方針（手動 / 自動生成 / ハイブリッド）
- [ ] CI でのテスト実行方針

---

## §12 インフラ / デプロイ

- [ ] ホスティングプラットフォーム（Vercel / AWS / GCP / Cloudflare / 自前）
- [ ] コンテナ化の有無（Docker / docker-compose）
- [ ] CI/CD パイプライン（GitHub Actions / CircleCI / GitLab CI）
- [ ] 環境分離（dev / staging / production）
- [ ] ドメイン / DNS 設定
- [ ] SSL/TLS 証明書管理
- [ ] CDN（静的アセット配信）

---

## §13 運用

- [ ] ログ基盤（構造化ログ、ログレベル、集約先）
- [ ] 監視 / アラート（Datadog / Sentry / CloudWatch / ...）
- [ ] 監査ログ（Usecase 実行履歴の記録方法）
- [ ] バックアップ戦略（頻度、保持期間）
- [ ] データ保持ポリシー（`_end` で論理削除したデータの保持期間）
- [ ] プライバシー対応（GDPR / 個人情報保護法）
- [ ] 利用規約 / プライバシーポリシー

# WebAppSpec — Webアプリケーション定義のためのデータ構造

## 目的

Webアプリケーションそのものを機械可読なデータ構造として表現する。

既存のアプローチ（UIモックアップ、UML、エンドポイント一覧、ドメインモデル図など）はそれぞれアプリの一側面しか捉えられない。WebAppSpec はこれらを統合し、アプリケーションの全体像を単一の構造で定義する。

### 想定する用途

- **LLMによる実装**: 定義を渡せば「何を作るか」が一意に決まる仕様書として機能する。グラフ構造なので、特定の operation に関連する entity, transition, spec だけを切り出して LLM に渡すことができる。
- **網羅的テスト生成**: entity の ownership, spec の rules, transition の conditions から、テストすべき Scenario のバリアント（正常系・異常系・権限境界）を機械的に導出する。

### 設計原則

- HTTPやUI実装の詳細に依存しない（REST/GraphQL/Server Actions のどれでも成立する）
- 各レイヤーが自分の責務だけを持ち、知識が正しい場所にある
- ビジネスルール（specs）とドメイン構造（domain）を明確に分離する

### WebAppSpec の外で決定すべきこと

WebAppSpec は「このアプリは何であるか」を定義する。以下は「どう作るか・どう運用するか」に属し、実装時に別途決定する。

**実装・インフラ系** — 技術選定とアーキテクチャの決定

- フレームワーク（フロントエンド・バックエンド）
- エンドポイント設計（REST / GraphQL / Server Actions、URL 構造、HTTP メソッド）
- データストレージ（RDB / NoSQL / KV、スキーマ設計）
- ファイルストレージ
- キャッシュ戦略
- 検索基盤
- 認証の実装（OAuth プロバイダ、JWT / Cookie / セッション）
- 認可の実施パターン（ミドルウェア / per-handler）
- 決済プロバイダ（Stripe 等）・価格設定
- Notification の配信手段（メール / プッシュ / アプリ内）
- SideEffect の処理基盤（同期 / キュー / cron）
- リアルタイム通信（WebSocket / SSE / polling）
- ホスティング・デプロイ
- セキュリティ実装（CORS, CSRF, CSP, XSS 対策, 暗号化, パスワードハッシュ, シークレット管理, セッション管理, 入力バリデーション方針）
- テストフレームワーク・テスト環境

**デザイン・UX 系** — ユーザーが触れる部分の決定

- デザインシステム・スタイリング
- URL ルーティング（どの View が独立した URL を持つか）
- 国際化（i18n）
- エラーの提示方法

**運用系** — 稼働後に必要な仕組みと規約

- 監視・ログ・アラート
- 監査ログ
- レートリミティング
- API バージョニング
- 依存パッケージの脆弱性管理
- データ保持ポリシー・プライバシー対応
- 利用規約・プライバシーポリシー

---

## 全体構造

```typescript
type WebAppSpec = {
  domain: Domain          // この世界の構造（ドメインエキスパートが語る事実）
  specs: Spec[]           // このアプリのビジネスルール（プロダクトオーナーが決める判断）
  usecases: Usecases      // 振る舞い層（誰が何をしたらどうなるか）
  scenarios: Scenario[]   // View ベースのユーザーシナリオ
  ui: UI                  // 画面表示に関する定義
  fixtures?: Fixture[]    // シミュレーション・テスト用のサンプルデータ
}

type Usecases = {
  actors: Actor[]           // 認証状態のラベル
  operations: Operation[]   // ドメイン操作
  sideEffects: SideEffect[] // operation 実行に伴う副作用
}

type UI = {
  components: Component[] // 画面上の操作・表示のまとまり
  views: View[]           // Component の配置と Operation への接続
}
```

---

## Domain — 世界の構造

アプリケーションが扱う世界の構造的事実を定義する。ビジネス判断で変わる条件付き制約は含まない（それは specs の役割）。

```typescript
type Domain = {
  entities: Entity[]
  relations: Relation[]
  transitions: Transition[]
}
```

### Entity

ドメインのモデル。フィールド定義に加えて、ownership（誰に所有されるか）、states（明示的な状態）、traits（導出される性質）を持つ。

```typescript
type Entity = {
  id: string
  fields: Field[]
  ownership: Ownership
  states: State[]
  traits: Trait[]
}

type Field = {
  name: string
  type: string
  required: boolean
}

// リソースがどう所有されうるか。Entity 側が宣言する。
type Ownership =
  | { kind: "personal", ownerField: string }              // 特定ユーザーが所有
  | { kind: "group", groupField: string }                 // 特定グループが所有
  | { kind: "participants", participantFields: string[] }  // 複数の参加者が関与（DM等）
  | { kind: "shared" }                                    // 誰でもアクセス可能

// 明示的な状態。フィールドの値で決まり、operation の transition で遷移する。
type State = {
  name: string
  field: string
  value: string
}

// 導出される性質。条件から計算され、直接遷移させることはできない。
type Trait = {
  name: string
  description: string
  derivedFrom: Condition
}
```

```typescript
// 例
const Todo: Entity = {
  id: "Todo",
  fields: [
    { name: "title", type: "string", required: true },
    { name: "status", type: "string", required: true },
    { name: "dueDate", type: "date", required: false },
    { name: "userId", type: "User.id", required: true },
    { name: "assigneeId", type: "User.id", required: false },
  ],
  ownership: { kind: "personal", ownerField: "userId" },
  states: [
    { name: "active", field: "status", value: "active" },
    { name: "completed", field: "status", value: "completed" },
  ],
  traits: [
    {
      name: "overdue",
      description: "期日が過ぎている",
      derivedFrom: { and: [
        { field: "dueDate", op: "lt", value: "now" },
        { field: "status", equals: "active" },
      ]},
    },
    {
      name: "unassigned",
      description: "担当者が未設定",
      derivedFrom: { field: "assigneeId", op: "is_null" },
    },
  ],
}
```

**State と Trait の違い:**

| | State | Trait |
|---|---|---|
| 決定方法 | フィールドの値 | 条件から導出 |
| 変更方法 | Transition で遷移 | 直接操作できない |
| 例 | active, completed | overdue, unassigned |

### Relation

Entity 間の構造的関連。純粋に構造だけを表現し、ビジネス条件による制約は持たない（制約は specs に置く）。

```typescript
type Relation = {
  id: string
  from: EntityRef
  to: EntityRef
  kind: "hasMany" | "belongsTo" | "manyToMany"
}
```

### Transition

状態遷移のルール。単一の Entity に閉じる遷移も、複数 Entity にまたがる遷移も同じ構造で表現する。全ての Transition を domain に集約することで、状態遷移の全体像が一箇所で見渡せる。

```typescript
type Transition = {
  id: string
  description: string
  changes: StateChange[]
  conditions: Condition[]
}

type StateChange = {
  entity: EntityRef
  state: { from: string, to: string }
  scope: "target" | "related"   // 操作対象自体か、関連先か
}
```

```typescript
// 単一 Entity の遷移
const completeTodo: Transition = {
  id: "complete-todo",
  description: "TODOの完了",
  changes: [
    { entity: "Todo", state: { from: "active", to: "completed" }, scope: "target" },
  ],
  conditions: [],
}

// 複数 Entity にまたがる遷移
const archiveProject: Transition = {
  id: "archive-project",
  description: "プロジェクトのアーカイブ",
  changes: [
    { entity: "Project", state: { from: "active", to: "archived" }, scope: "target" },
    { entity: "Todo", state: { from: "active", to: "cancelled" }, scope: "related" },
  ],
  conditions: [
    { entity: "Project", trait: "has-no-in-progress-todos" },
  ],
}
```

Entity 内に閉じるか複数にまたがるかは現時点の偶然であり、構造的な区別ではない。最初は単一 Entity の遷移でも後から複数 Entity に拡張されることは多いため、最初から同じ場所に統一しておく。

#### 擬似状態 `_start` / `_end`

Entity の作成と削除を状態遷移として表現するための予約語。Entity の states に定義してはならない。

- `_start` — Entity が存在する前の状態。`from` にのみ使用可能。
- `_end` — Entity がこの仕様上もう扱われない状態（削除）。`to` にのみ使用可能。物理削除か論理削除かは実装の決定事項。

```typescript
// 作成: _start → 初期状態
const createTodo: Transition = {
  id: "create-todo",
  description: "TODOの作成",
  changes: [
    { entity: "Todo", state: { from: "_start", to: "active" }, scope: "target" },
  ],
  conditions: [],
}

// 削除: 任意の状態 → _end
const deleteTodo: Transition = {
  id: "delete-todo",
  description: "TODOの削除",
  changes: [
    { entity: "Todo", state: { from: "active", to: "_end" }, scope: "target" },
  ],
  conditions: [],
}
```

---

## Specs — ビジネスルール

アプリケーション固有の条件付き制約。domain が「世界はこういう構造である」という事実を述べるのに対し、specs は「このアプリではこういうルールを課す」というビジネス判断を表現する。

プランや状態によって変動する制約はここに定義する。Transition の conditions に繰り返し書く必要がなく、関連する Transition に横断的に適用される。

```typescript
type Spec = {
  id: string
  description: string
  rules: Rule[]
}

type Rule = {
  when: Condition
  constraint: Constraint
}
```

```typescript
// 例: プランに応じたチーム所属数の上限
const teamMembershipLimit: Spec = {
  id: "team-membership-limit",
  description: "ユーザーが所属できるチーム数の上限",
  rules: [
    {
      when: { entity: "User", trait: "free-plan" },
      constraint: { relation: "user-teams", maxCount: 5 },
    },
    {
      when: { entity: "User", trait: "pro-plan" },
      constraint: { relation: "user-teams", maxCount: 20 },
    },
    {
      when: { entity: "User", trait: "enterprise-plan" },
      constraint: { relation: "user-teams", maxCount: null },  // 無制限
    },
  ],
}

// 例: プランに応じた機能制限
const projectVisibility: Spec = {
  id: "project-visibility",
  description: "プロジェクトの公開設定の制約",
  rules: [
    {
      when: { entity: "User", trait: "free-plan" },
      constraint: { entity: "Project", field: "visibility", allowedValues: ["private"] },
    },
    {
      when: { entity: "User", trait: "pro-plan" },
      constraint: { entity: "Project", field: "visibility", allowedValues: ["private", "public"] },
    },
  ],
}
```

### Spec と Transition の連携

Transition は Spec を直接参照しない。Spec が Transition に制約をかぶせる形で、結合を緩く保つ。

```
Transition "Team に参加する" が実行される
  → 関連する Spec を自動で検査
  → "team-membership-limit" が適用され、User の plan に応じた maxCount を確認
  → 違反していれば実行不可
```

### テスト生成への寄与

Spec の rules から、プラン変更と組み合わせたテストケースが機械的に導出できる:

1. free-plan ユーザーが5チーム目に参加する → 成功
2. free-plan ユーザーが6チーム目に参加する → 拒否
3. pro-plan ユーザーが20チーム目に参加する → 成功
4. free → pro にアップグレード後、6チーム目に参加する → 成功

---

## Actors — 認証状態のラベル

Actor は独立した概念ではなく、特定の認証状態になった anonymous のエイリアス。全てのセッションは anonymous として始まり、認証ステップを経て特定の Actor になる。

人間のユーザーだけでなく、外部システムも Actor として扱う。Stripe からの webhook はヘッダ検証という認証を経て stripe Actor になり、配送業者からのコールバックも同様。「認証を経て身元が確認されたリクエスト元」という統一的な扱い。

```typescript
type Actor = {
  id: string
  authState: AuthState
  authMethods?: AuthMethod[]  // この actor になるための認証手段
  entity?: EntityRef          // この actor が対応するエンティティ（例: member → User）
}

type AuthState =
  | { kind: "anonymous" }
  | { kind: "authenticated", roles: string[] }
  | { kind: "pending_mfa", identity: string }
  | { kind: "expired" }

type AuthMethod =
  | { kind: "email-password" }
  | { kind: "oauth", providers?: string[] }
  | { kind: "magic-link" }
  | { kind: "passkey" }
  | { kind: "api-key" }
  | { kind: "webhook-signature" }
  | { kind: "client-certificate" }
```

`entity` は optional。人間のユーザーを表す actor は対応するエンティティを持つ（`member` → `User`）。外部システム（webhook 等）の actor はエンティティを持たない。

`authMethods` は、この actor の認証状態に到達するための手段を定義する。「ユーザーはメールとパスワードでログインする」「Stripe は webhook 署名で認証する」といったプロダクトレベルの決定を表現する。セッション管理方式（JWT / Cookie 等）やパスワードハッシュアルゴリズムといった実装詳細は含まない。

operation の input で `"actor.id"` と指定すると、実行時に actor にバインドされたエンティティインスタンスの ID に解決される。これにより「自分の Todo を作成する」のような操作で、actor の User ID を自動的に設定できる。

```typescript
const actors: Actor[] = [
  // 人間のユーザー（entity あり）
  { id: "anonymous", authState: { kind: "anonymous" } },
  {
    id: "member",
    authState: { kind: "authenticated", roles: ["member"] },
    authMethods: [{ kind: "email-password" }, { kind: "oauth", providers: ["google"] }],
    entity: "User",
  },
  {
    id: "admin",
    authState: { kind: "authenticated", roles: ["admin"] },
    authMethods: [{ kind: "email-password" }],
    entity: "User",
  },
  // 外部システム（entity なし）
  {
    id: "stripe",
    authState: { kind: "authenticated", roles: ["payment-provider"] },
    authMethods: [{ kind: "webhook-signature" }],
  },
  {
    id: "carrier",
    authState: { kind: "authenticated", roles: ["shipping-provider"] },
    authMethods: [{ kind: "api-key" }],
  },
]
```

Scenario は Actor を指定するだけで、「その Actor になるための認証ステップ」は暗黙の precondition として扱う。テスト生成時には Actor の authState と authMethods から認証ステップを自動で前置できる。

---

## Operations — ドメイン操作

アプリケーションが提供する操作。domain service に相当するレイヤーで、HTTP エンドポイントとは 1:1 対応しない。

Operation は Entity の state/trait を名前で参照するだけで、フィルタ条件の詳細を知らない。

```typescript
type Operation = {
  id: string
  description: string
  actor: ActorRef
  target: Target
  input: Schema
  transition?: TransitionRef       // 状態遷移を伴わない参照系 operation では省略可
  conditions?: Condition[]         // この actor がこの操作を実行するための前提条件
  errors: ErrorCase[]
  followUps?: FollowUpOperation[]  // この operation の後に外部起点で起きうる operation
}

type FollowUpOperation = {
  description: string             // "決済成功", "決済失敗"
  operation: OperationRef
}

type Target =
  | { kind: "single", entity: EntityRef, scopeByActor?: string[] }
  | { kind: "collection", entity: EntityRef, matching: string[], scopeByActor?: string[] }
  //                                         ↑ state/trait の名前のみ
```

```typescript
// 単一エンティティへの操作（scopeByActor で自分の Todo にだけ操作を限定）
const completeTodo: Operation = {
  id: "complete-todo",
  description: "TODOを完了にする",
  actor: "member",
  target: { kind: "single", entity: "Todo", scopeByActor: ["userId"] },
  input: { todoId: "Todo.id" },
  transition: "complete-todo",
  errors: [
    { when: "既に完了済み", description: "完了済みのTODOは再度完了できない" },
  ],
}

// actor.id で自分の User ID を自動注入する作成操作
const createTodo: Operation = {
  id: "create-todo",
  description: "新しいTODOを作成する",
  actor: "member",
  target: { kind: "single", entity: "Todo" },
  input: { title: "string", userId: "actor.id" },
  transition: "create-todo",
  errors: [],
}

// コレクションへの操作（trait で対象を選択）
const completeAllOverdue: Operation = {
  id: "complete-all-overdue",
  description: "期日超過のTODOを全て完了にする",
  actor: "member",
  target: { kind: "collection", entity: "Todo", matching: ["overdue"] },
  input: {},
  transition: "complete-todo",
  errors: [],
}

// 外部システム連携を含む操作（followUps で後続の外部起点 operation を宣言）
const purchaseOrder: Operation = {
  id: "purchase-order",
  description: "注文の決済を開始する",
  actor: "member",
  target: { kind: "single", entity: "Order" },
  input: { orderId: "Order.id" },
  transition: "initiate-payment",
  errors: [],
  followUps: [
    { description: "決済成功", operation: "payment-succeeded" },
    { description: "決済失敗", operation: "payment-failed" },
  ],
}

// 外部システム（stripe）が起動する operation
const paymentSucceeded: Operation = {
  id: "payment-succeeded",
  description: "決済が成功した",
  actor: "stripe",
  target: { kind: "single", entity: "Order" },
  input: { orderId: "Order.id" },
  transition: "payment-succeeded",
  errors: [],
}

const paymentFailed: Operation = {
  id: "payment-failed",
  description: "決済が失敗した",
  actor: "stripe",
  target: { kind: "single", entity: "Order" },
  input: { orderId: "Order.id" },
  transition: "payment-failed",
  errors: [],
}
```

### Operation conditions と Transition conditions の違い

Transition の `conditions` はドメイン不変条件 — 誰が操作しても常に成り立つべきルール。Operation の `conditions` は actor に依存する操作の前提条件。

```typescript
// ドメイン不変条件: 公開済みの記事にしかコメントできない（actor 非依存）
const createComment: Transition = {
  id: "create-comment",
  changes: [{ entity: "Comment", state: { from: "_start", to: "visible" }, scope: "target" }],
  conditions: [{ field: "status", equals: "published" }],
}

// actor 依存の前提条件: member は locked な TODO を削除できない
const deleteTodo: Operation = {
  id: "delete-todo",
  actor: "member",
  target: { kind: "single", entity: "Todo" },
  input: { todoId: "Todo.id" },
  transition: "delete-todo",
  conditions: [{ field: "lockStatus", equals: "released" }],
  errors: [],
}

// admin は lock に関係なく削除できる
const adminDeleteTodo: Operation = {
  id: "admin-delete-todo",
  actor: "admin",
  target: { kind: "single", entity: "Todo" },
  input: { todoId: "Todo.id" },
  transition: "delete-todo",
  conditions: [],
  errors: [],
}
```

### Operation と Endpoint の関係

Endpoint は WebAppSpec に含めない。Operation を HTTP でどう公開するかは実装時の関心事。

```
1 operation → N endpoints:
  "TODOを列挙する" → GET /todos (画面用), GET /api/todos (API用)

N operations → 1 endpoint:
  バッチエンドポイントが複数 operation を束ねる

1 endpoint → 0 operation:
  ヘルスチェック等はドメインの operation ではない
```

---

## Side Effects — 副作用

Operation の実行に伴う副作用（通知、ログ、外部連携など）。Operation を純粋なドメインの状態変更に保つために分離する。

```typescript
type SideEffect = {
  trigger: { operation: OperationRef, entity: EntityRef }
  when: Condition[]
  notify: NotificationTarget
  description: string
}

type NotificationTarget =
  | { actor: ActorRef }
  | { owner: EntityRef }
  | { external: string }
```

```typescript
const notifyOnComplete: SideEffect = {
  trigger: { operation: "complete-todo", entity: "Todo" },
  when: [{ field: "assigneeId", op: "is_not_null" }],
  notify: { owner: "Todo" },
  description: "担当者にTODO完了を通知する",
}
```

通知先は actor（特定のロール）、owner（Entity の所有者）、external（外部サービス）の3種から指定する。実装上はドメインサービスとイベントハンドラの分離に対応する。

---

## Scenarios — ユーザーシナリオ

View ベースのユーザーシナリオ。Actor が画面を通じて操作する一連の流れを定義する。各ステップは「どの画面でどの操作をするか」を表す。

```typescript
type ViewStep = {
  view: ViewRef
  action?: OperationRef     // 画面上で実行する操作（省略 = 閲覧のみ）
  description: string
}

type BackgroundStep = {
  operation: OperationRef    // ブラウザ外のバックグラウンド処理
  actor: ActorRef            // 実行主体（Scenario の actor とは別）
  description: string
}

type Scenario = {
  id: string
  actor: ActorRef
  goal: string
  steps: (ViewStep | BackgroundStep | ScenarioRef)[]
  variants?: Scenario[]
}
```

```typescript
const manageTodos: Scenario = {
  id: "manage-todos",
  actor: "member",
  goal: "今日のタスクを整理する",
  steps: [
    { view: "todo-dashboard", description: "一覧を確認" },
    { view: "todo-dashboard", action: "complete-todo" },
    { view: "todo-dashboard", action: "delete-all-completed" },
  ],
  variants: [],
}
```

### テストバリアントの自動導出

人間は正常系の Scenario だけを書けばよい。異常系・権限境界のバリアントは以下から機械的に導出できる:

**Entity の ownership から:**

| ownership | 導出バリアント |
|---|---|
| personal | owner本人 → 許可 / 別ユーザー → 拒否 / anonymous → 拒否 |
| group | メンバー → 許可 / 非メンバー → 拒否 |
| shared | 誰でも → 許可 |
| participants | 参加者 → 許可 / 非参加者 → 拒否 |

**Spec の rules から:**

プラン別の制約条件 × 境界値でテストケースを生成（上限ちょうど、上限+1、プラン変更前後など）。

**Transition の conditions から:**

条件を満たす / 満たさないの各パターン。

---

## UI — 画面表示

画面上の操作・表示のまとまり（Component）と、その配置（View）を定義する。見た目やレイアウトの詳細には踏み込まない（それはデザインの関心事）。

### Component

画面上の操作・表示の単位。バックエンドからデータを取得して表示するだけのものから、Actor の入力を変換して Operation に渡すものまで、全て Component として統一的に扱う。

各フィールドが埋まるか空かの違いだけで、さまざまなパターンを表現できる:

- 表示のみ: sources → displays（ダッシュボードの統計、お知らせ一覧）
- 表示 + 変換: sources → transforms → displays（完了率の表示）
- 選択: sources → outputs（TODO一覧から1件選ぶ）
- 入力 + 出力: inputs → outputs（単純なフォーム）
- 入力 + 変換 + 表示 + 出力: inputs → transforms → displays + outputs（配送サイズ計算）

```typescript
type Component = {
  id: string
  description: string
  sources: DataSource[]     // 初期表示に必要なバックエンドのデータ
  inputs: Field[]           // Actor が入力する値
  transforms: Transform[]   // クライアント側の変換（what, not how）
  displays: Field[]         // Actor に表示するが永続化しない値
  outputs: Field[]          // Operation に渡す値
}

// Component が表示に必要とするバックエンドデータの宣言
type DataSource = {
  entity: EntityRef
  matching?: string[]       // state/trait でフィルタ
  fields: string[]          // 必要なフィールド
  paginated?: boolean       // ページネーションされるか
  sort?: SortField[]        // 表示順
}

type SortField = {
  field: string
  order: "asc" | "desc"
}

type Transform = {
  description: string       // "三辺合計からサイズカテゴリを導出する"
  from: string[]            // 入力フィールド名
  to: string                // 出力フィールド名
}
```

```typescript
// 表示のみ: お知らせ一覧
const announcementList: Component = {
  id: "announcement-list",
  description: "お知らせ一覧を表示する",
  sources: [
    { entity: "Announcement", matching: ["active"], fields: ["title", "body", "publishedAt"] },
  ],
  inputs: [],
  transforms: [],
  displays: [
    { name: "title", type: "string" },
    { name: "body", type: "string" },
    { name: "publishedAt", type: "date" },
  ],
  outputs: [],
}

// 選択: TODO一覧から1件選ぶ
const todoSelector: Component = {
  id: "todo-selector",
  description: "TODO一覧から1件選択する",
  sources: [
    {
      entity: "Todo",
      matching: ["active"],
      fields: ["id", "title", "dueDate"],
      paginated: true,
      sort: [{ field: "dueDate", order: "asc" }, { field: "createdAt", order: "desc" }],
    },
  ],
  inputs: [],
  transforms: [],
  displays: [],
  outputs: [
    { name: "todoId", type: "Todo.id" },
  ],
}

// 入力 + 変換 + 表示 + 出力: 配送サイズ計算
const shippingCalculator: Component = {
  id: "shipping-calculator",
  description: "梱包サイズから配送カテゴリと料金目安を算出する",
  sources: [],
  inputs: [
    { name: "length", type: "number" },
    { name: "width", type: "number" },
    { name: "height", type: "number" },
  ],
  transforms: [
    { description: "三辺合計からサイズカテゴリを導出する", from: ["length", "width", "height"], to: "sizeCategory" },
    { description: "サイズカテゴリから料金目安を算出する", from: ["sizeCategory"], to: "estimatedPrice" },
  ],
  displays: [
    { name: "estimatedPrice", type: "number" },
  ],
  outputs: [
    { name: "sizeCategory", type: "string" },
  ],
}
```

### View

Component の配置と、Component の output から Operation への接続を定義する。View は URL を持つページに限らず、モーダルやドロワーなども含む。

```typescript
type View = {
  id: string
  components: ComponentRef[]   // この View に配置する Component
  actions: ViewAction[]        // Component の output → Operation の接続
}

type ViewAction = {
  operation: OperationRef
  inputFrom: Record<string, string>  // { operation の input名: "componentId.output名" }
}
```

```typescript
const todoListView: View = {
  id: "todo-list",
  components: ["todo-selector", "announcement-list"],
  actions: [
    {
      operation: "complete-todo",
      inputFrom: { todoId: "todo-selector.todoId" },
    },
  ],
}
```

---

## Fixtures — サンプルデータ

シミュレーションやテスト生成で利用するプリセットデータ。Entity 間の関連を含むデータセットをまとめて定義する。

```typescript
type FixtureInstance = {
  entity: EntityRef
  id: string
  fields: Record<string, unknown>
}

type Fixture = {
  id: string
  description: string
  instances: FixtureInstance[]
}
```

```typescript
const basicSetup: Fixture = {
  id: "basic-setup",
  description: "ユーザー2名とTODO数件の基本データ",
  instances: [
    { entity: "User", id: "User-1", fields: { name: "Alice", email: "alice@example.com", status: "active" } },
    { entity: "User", id: "User-2", fields: { name: "Bob", email: "bob@example.com", status: "active" } },
    { entity: "Todo", id: "Todo-1", fields: { title: "Buy groceries", completion: "incomplete", availability: "available", userId: "User-1" } },
    { entity: "Todo", id: "Todo-2", fields: { title: "Write report", completion: "complete", availability: "available", userId: "User-1" } },
  ],
}
```

### 設計意図

- **Entity 横断のフラットなリスト**: `instances` はエンティティ種別をまたいだフラットな配列。Entity 間の参照関係（`userId: "User-1"` など）が一箇所で見渡せる。
- **複数 Fixture**: シナリオ別に異なるデータセットを定義できる（正常系、エッジケース、大量データなど）。
- **ID の明示**: 各インスタンスの `id` はフィールドではなくトップレベルで指定する。Fixture 内の他インスタンスから参照できるよう、人間が読みやすい固定 ID を使う。
- **状態フィールドの明示**: Entity の state に対応するフィールド（`status: "active"`, `completion: "incomplete"` など）を直接指定する。Transition を経由せず、任意の状態のインスタンスを直接作成できる。

### シミュレーションでの利用

Fixture を読み込むと、定義されたインスタンスが初期データとしてセットされる。シミュレーションのリセット時は Fixture の状態に戻る（空の状態ではなく）。Actor を Entity インスタンスにバインドすることで、`scopeByActor` による操作権限の検証も Fixture データ上で即座に確認できる。

---

## レイヤー間の責務分離

```
Entity:       「自分はどういう構造で、どんな状態・性質を持つか」を宣言する
Relation:     「Entity 間の構造的関連」を宣言する
Transition:   「どの状態からどの状態に遷移しうるか」を定義する（Entity 横断可）
Spec:         「このアプリ固有の条件付き制約」を定義する（ビジネスルール）
Actor:        「認証状態のラベル」を定義する
Operation:    「誰がどの Transition を発動できるか」を定義する
SideEffect:   「Operation 実行時の副作用」を定義する
Scenario:     「View ベースのユーザーシナリオ」を定義する
Component:    「画面上の操作・表示のまとまり」を定義する
View:         「Component の配置と Operation への接続」を定義する
Fixture:      「シミュレーション・テスト用のサンプルデータ」を定義する
```

知識の所在:

```
「期日が過ぎている」とは何か        → Entity が知っている (trait)
「期日超過のTODOをどうするか」      → Operation が知っている (transition の適用)
「いつそれをやるか」               → Scenario が知っている (ステップの順序)
「何個まで作れるか」               → Spec が知っている (条件付き制約)
「このリソースは誰のものか」        → Entity が知っている (ownership)
「このユーザーは何者か」            → Actor が知っている (authState)
「表示に何のデータが必要か」        → Component が知っている (sources)
「どの画面でどの操作ができるか」    → View が知っている (actions)
```

---

## 共通型

```typescript
type EntityRef = string
type OperationRef = string
type TransitionRef = string
type ActorRef = string
type ComponentRef = string
type RelationRef = string
type ViewRef = string
type ScenarioRef = string
type SpecRef = string

type Condition =
  | { field: string, equals: string }
  | { field: string, op: "lt" | "gt" | "lte" | "gte" | "is_null" | "is_not_null", value?: any }
  | { entity: EntityRef, trait: string }
  | { and: Condition[] }
  | { or: Condition[] }

type Constraint =
  | { relation: string, maxCount: number | null }
  | { entity: EntityRef, ownedBy: string, maxCount: number | null }
  | { entity: EntityRef, field: string, allowedValues: string[] }

type NotificationTarget =
  | { actor: ActorRef }
  | { owner: EntityRef }
  | { external: string }

type Schema = Record<string, string>
type ErrorCase = { when: string, description: string }
```

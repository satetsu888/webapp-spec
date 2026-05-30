export const PSEUDO_STATES = ["_start", "_end"] as const;
export type PseudoState = (typeof PSEUDO_STATES)[number];

export type EntityRef = string;
export type OperationRef = string;
export type TransitionRef = string;
export type ActorRef = string;
export type ComponentRef = string;
export type RelationRef = string;
export type ViewRef = string;
export type ScenarioRef = string;
export type SpecRef = string;

export type Condition =
  | { field: string; equals: string }
  | {
      field: string;
      op: "lt" | "gt" | "lte" | "gte" | "is_null" | "is_not_null";
      value?: unknown;
    }
  | { entity: EntityRef; trait: string }
  | { and: Condition[] }
  | { or: Condition[] };

export type Constraint =
  | { relation: string; maxCount: number | null }
  | { entity: EntityRef; ownedBy: string; maxCount: number | null }
  | { entity: EntityRef; field: string; allowedValues: string[] };

export type NotificationTarget =
  | { actor: ActorRef }
  | { owner: EntityRef }
  | { external: string };

export type Schema = Record<string, string>;

export type ErrorCase = {
  when: string;
  description: string;
};

// --- Domain ---

export type Field = {
  name: string;
  type: string;
  required: boolean;
};

export type Ownership =
  | { kind: "personal"; ownerField: string }
  | { kind: "group"; groupField: string }
  | { kind: "participants"; participantFields: string[] }
  | { kind: "shared" };

export type State = {
  name: string;
  field: string;
  value: string;
};

export type Trait = {
  name: string;
  description: string;
  derivedFrom: Condition;
};

export type Entity = {
  id: string;
  fields: Field[];
  ownership: Ownership;
  states: State[];
  traits: Trait[];
};

export type Relation = {
  id: string;
  from: EntityRef;
  to: EntityRef;
  kind: "hasMany" | "belongsTo" | "manyToMany";
};

export type StateChange = {
  entity: EntityRef;
  state: { from: string; to: string };
  scope: "target" | "related";
};

export type Transition = {
  id: string;
  description: string;
  changes: StateChange[];
  conditions: Condition[];
};

export type Domain = {
  entities: Entity[];
  relations: Relation[];
  transitions: Transition[];
};

// --- Specs ---

export type Rule = {
  when: Condition;
  constraint: Constraint;
};

export type Spec = {
  id: string;
  description: string;
  rules: Rule[];
};

// --- Actors ---

export type AuthState =
  | { kind: "anonymous" }
  | { kind: "authenticated"; roles: string[] }
  | { kind: "pending_mfa"; identity: string }
  | { kind: "expired" };

export type AuthMethod =
  | { kind: "email-password" }
  | { kind: "oauth"; providers?: string[] }
  | { kind: "magic-link" }
  | { kind: "passkey" }
  | { kind: "api-key" }
  | { kind: "webhook-signature" }
  | { kind: "client-certificate" };

export type Actor = {
  id: string;
  authState: AuthState;
  authMethods?: AuthMethod[];
  entity?: EntityRef;
};

// --- Operations ---

export type Target =
  | { kind: "single"; entity: EntityRef; scopeByActor?: string[] }
  | { kind: "collection"; entity: EntityRef; matching: string[]; scopeByActor?: string[] };

export type FollowUpOperation = {
  description: string;
  operation: OperationRef;
};

export type Operation = {
  id: string;
  description: string;
  actor: ActorRef;
  target: Target;
  input: Schema;
  transition?: TransitionRef;
  conditions?: Condition[];
  errors: ErrorCase[];
  followUps?: FollowUpOperation[];
};

// --- Side Effects ---

export type SideEffect = {
  trigger: { operation: OperationRef; entity: EntityRef };
  when: Condition[];
  notify: NotificationTarget;
  description: string;
};

// --- Scenarios ---

export type ViewStep = {
  view: ViewRef;
  action?: OperationRef;
  description: string;
};

export type BackgroundStep = {
  operation: OperationRef;
  actor: ActorRef;
  description: string;
};

export type Scenario = {
  id: string;
  actor: ActorRef;
  goal: string;
  steps: (ViewStep | BackgroundStep | ScenarioRef)[];
  variants?: Scenario[];
};

// --- UI ---

export type SortField = {
  field: string;
  order: "asc" | "desc";
};

export type DataSource = {
  entity: EntityRef;
  matching?: string[];
  fields: string[];
  paginated?: boolean;
  sort?: SortField[];
};

export type Transform = {
  description: string;
  from: string[];
  to: string;
};

export type Component = {
  id: string;
  description: string;
  sources: DataSource[];
  inputs: Field[];
  transforms: Transform[];
  displays: Field[];
  outputs: Field[];
};

export type ViewAction = {
  operation: OperationRef;
  inputFrom: Record<string, string>;
};

export type View = {
  id: string;
  components: ComponentRef[];
  actions: ViewAction[];
};

export type UI = {
  components: Component[];
  views: View[];
};

// --- Fixtures ---

export type FixtureInstance = {
  entity: EntityRef;
  id: string;
  fields: Record<string, unknown>;
};

export type Fixture = {
  id: string;
  description: string;
  instances: FixtureInstance[];
};

// --- Root ---

export type Usecases = {
  actors: Actor[];
  operations: Operation[];
  sideEffects: SideEffect[];
};

export type WebAppSpec = {
  webappSpec: string;
  name: string;
  version: string;
  domain: Domain;
  specs: Spec[];
  usecases: Usecases;
  scenarios: Scenario[];
  ui: UI;
  fixtures?: Fixture[];
};

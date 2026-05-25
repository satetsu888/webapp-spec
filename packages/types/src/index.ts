export const PSEUDO_STATES = ["_start", "_end"] as const;
export type PseudoState = (typeof PSEUDO_STATES)[number];

export type EntityRef = string;
export type UsecaseRef = string;
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
  required?: boolean;
};

export type Ownership =
  | { kind: "personal"; ownerField: string }
  | { kind: "group"; groupField: string }
  | { kind: "role_scoped"; requiredRole: string }
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

export type Actor = {
  id: string;
  authState: AuthState;
};

// --- Usecases ---

export type Target =
  | { kind: "single"; entity: EntityRef }
  | { kind: "collection"; entity: EntityRef; matching: string[] };

export type FollowUpUsecase = {
  description: string;
  usecase: UsecaseRef;
};

export type Usecase = {
  id: string;
  description: string;
  actor: ActorRef;
  target: Target;
  input: Schema;
  transition?: TransitionRef;
  errors: ErrorCase[];
  followUps?: FollowUpUsecase[];
};

// --- Reactions ---

export type Reaction = {
  trigger: { usecase: UsecaseRef; entity: EntityRef };
  when: Condition[];
  notify: NotificationTarget;
  description: string;
};

// --- Scenarios ---

export type ViewStep = {
  view: ViewRef;
  action?: UsecaseRef;
  description: string;
};

export type BackgroundStep = {
  usecase: UsecaseRef;
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
  usecase: UsecaseRef;
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

// --- Root ---

export type WebAppSpec = {
  webappSpec: string;
  name: string;
  version: string;
  domain: Domain;
  specs: Spec[];
  actors: Actor[];
  usecases: Usecase[];
  reactions: Reaction[];
  scenarios: Scenario[];
  ui: UI;
};

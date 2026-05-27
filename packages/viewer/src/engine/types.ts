import type { NotificationTarget } from "@webapp-spec/types";

export type EntityInstance = {
  id: string;
  entityType: string;
  fields: Record<string, unknown>;
};

export type Mutation =
  | { kind: "created"; entity: string; instance: EntityInstance }
  | {
      kind: "stateChanged";
      entity: string;
      instanceId: string;
      field: string;
      from: string;
      to: string;
    }
  | { kind: "deleted"; entity: string; instanceId: string };

export type FiredReaction = {
  description: string;
  notify: NotificationTarget;
};

export type ExecutionResult = {
  success: boolean;
  usecaseId: string;
  mutations: Mutation[];
  firedReactions: FiredReaction[];
  error?: string;
};

export type FixtureSnapshot = {
  instances: Record<string, EntityInstance[]>;
  nextId: Record<string, number>;
};

export type SimState = {
  instances: Record<string, EntityInstance[]>;
  nextId: Record<string, number>;
  selectedActor: string | null;
  selectedView: string | null;
  actorInstances: Record<string, string>;
  executionLog: ExecutionResult[];
  fixtureState: FixtureSnapshot | null;
};

export type SimAction =
  | { type: "SELECT_ACTOR"; actor: string | null }
  | { type: "SELECT_VIEW"; view: string | null }
  | { type: "BIND_ACTOR_INSTANCE"; actor: string; instanceId: string }
  | { type: "APPLY_RESULT"; result: ExecutionResult }
  | { type: "LOAD_FIXTURE"; instances: Record<string, EntityInstance[]>; nextId: Record<string, number> }
  | { type: "RESET" };

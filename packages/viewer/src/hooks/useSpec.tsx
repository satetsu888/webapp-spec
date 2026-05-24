import { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  WebAppSpec,
  Entity,
  Relation,
  Transition,
  Actor,
  Usecase,
  Spec,
  Reaction,
  Journey,
  Component,
  View,
} from "@webapp-spec/types";

export type SpecLookups = {
  spec: WebAppSpec;
  entityMap: Map<string, Entity>;
  relationMap: Map<string, Relation>;
  transitionMap: Map<string, Transition>;
  actorMap: Map<string, Actor>;
  usecaseMap: Map<string, Usecase>;
  specMap: Map<string, Spec>;
  componentMap: Map<string, Component>;
  viewMap: Map<string, View>;
  journeyMap: Map<string, Journey>;
  relationsForEntity: (entityId: string) => Relation[];
  transitionsForEntity: (entityId: string) => Transition[];
  usecasesByActor: (actorId: string) => Usecase[];
  reactionsByUsecase: (usecaseId: string) => Reaction[];
  stateColorClass: (entityId: string, stateName: string) => string;
};

const STATE_COLOR_CLASSES = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-purple-100 text-purple-800",
  "bg-cyan-100 text-cyan-800",
  "bg-rose-100 text-rose-800",
  "bg-indigo-100 text-indigo-800",
  "bg-teal-100 text-teal-800",
];

const SpecContext = createContext<SpecLookups | null>(null);

function buildLookups(spec: WebAppSpec): SpecLookups {
  const entityMap = new Map(spec.domain.entities.map((e) => [e.id, e]));
  const relationMap = new Map(spec.domain.relations.map((r) => [r.id, r]));
  const transitionMap = new Map(spec.domain.transitions.map((t) => [t.id, t]));
  const actorMap = new Map(spec.actors.map((a) => [a.id, a]));
  const usecaseMap = new Map(spec.usecases.map((u) => [u.id, u]));
  const specMap = new Map(spec.specs.map((s) => [s.id, s]));
  const componentMap = new Map(spec.ui.components.map((c) => [c.id, c]));
  const viewMap = new Map(spec.ui.views.map((v) => [v.id, v]));
  const journeyMap = new Map(spec.journeys.map((j) => [j.id, j]));

  const entityRelations = new Map<string, Relation[]>();
  for (const r of spec.domain.relations) {
    for (const eid of [r.from, r.to]) {
      const list = entityRelations.get(eid) ?? [];
      list.push(r);
      entityRelations.set(eid, list);
    }
  }

  const entityTransitions = new Map<string, Transition[]>();
  for (const t of spec.domain.transitions) {
    for (const ch of t.changes) {
      const list = entityTransitions.get(ch.entity) ?? [];
      if (!list.includes(t)) list.push(t);
      entityTransitions.set(ch.entity, list);
    }
  }

  const actorUsecases = new Map<string, Usecase[]>();
  for (const u of spec.usecases) {
    const list = actorUsecases.get(u.actor) ?? [];
    list.push(u);
    actorUsecases.set(u.actor, list);
  }

  const usecaseReactions = new Map<string, Reaction[]>();
  for (const r of spec.reactions) {
    const list = usecaseReactions.get(r.trigger.usecase) ?? [];
    list.push(r);
    usecaseReactions.set(r.trigger.usecase, list);
  }

  const stateColorMap = new Map<string, string>();
  for (const entity of spec.domain.entities) {
    entity.states.forEach((s, i) => {
      stateColorMap.set(
        `${entity.id}:${s.name}`,
        STATE_COLOR_CLASSES[i % STATE_COLOR_CLASSES.length],
      );
    });
  }

  return {
    spec,
    entityMap,
    relationMap,
    transitionMap,
    actorMap,
    usecaseMap,
    specMap,
    componentMap,
    viewMap,
    journeyMap,
    relationsForEntity: (id) => entityRelations.get(id) ?? [],
    transitionsForEntity: (id) => entityTransitions.get(id) ?? [],
    usecasesByActor: (id) => actorUsecases.get(id) ?? [],
    reactionsByUsecase: (id) => usecaseReactions.get(id) ?? [],
    stateColorClass: (entityId, stateName) => {
      if (stateName === "_start") return "bg-gray-200 text-gray-600";
      if (stateName === "_end") return "bg-red-100 text-red-800";
      return stateColorMap.get(`${entityId}:${stateName}`) ?? "bg-gray-100 text-gray-800";
    },
  };
}

export function SpecProvider({
  spec,
  children,
}: {
  spec: WebAppSpec;
  children: ReactNode;
}) {
  const lookups = useMemo(() => buildLookups(spec), [spec]);
  return (
    <SpecContext.Provider value={lookups}>{children}</SpecContext.Provider>
  );
}

export function useSpec() {
  const ctx = useContext(SpecContext);
  if (!ctx) throw new Error("useSpec must be used within SpecProvider");
  return ctx;
}

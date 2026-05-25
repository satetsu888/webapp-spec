import { describe, it, expect } from "vitest";
import { validate } from "../src/validator.js";
import { compareSemver } from "../src/semver.js";
import type { WebAppSpec } from "@webapp-spec/types";

function minimalSpec(overrides?: Partial<WebAppSpec>): WebAppSpec {
  return {
    webappSpec: "0.1.0",
    name: "Test App",
    version: "1.0.0",
    domain: {
      entities: [
        {
          id: "Todo",
          fields: [
            { name: "title", type: "string" },
            { name: "status", type: "string" },
            { name: "userId", type: "User.id" },
          ],
          ownership: { kind: "personal", ownerField: "userId" },
          states: [
            { name: "active", field: "status", value: "active" },
            { name: "completed", field: "status", value: "completed" },
          ],
          traits: [],
        },
      ],
      relations: [],
      transitions: [
        {
          id: "create-todo",
          description: "TODOを作成する",
          changes: [
            { entity: "Todo", state: { from: "_start", to: "active" }, scope: "target" },
          ],
          conditions: [],
        },
        {
          id: "complete-todo",
          description: "TODOを完了にする",
          changes: [
            { entity: "Todo", state: { from: "active", to: "completed" }, scope: "target" },
          ],
          conditions: [],
        },
      ],
    },
    specs: [],
    actors: [
      { id: "member", authState: { kind: "authenticated", roles: ["member"] } },
    ],
    usecases: [
      {
        id: "create-todo",
        description: "TODOを作成する",
        actor: "member",
        target: { kind: "single", entity: "Todo" },
        input: { title: "string" },
        transition: "create-todo",
        errors: [],
      },
      {
        id: "complete-todo",
        description: "TODOを完了にする",
        actor: "member",
        target: { kind: "single", entity: "Todo" },
        input: { todoId: "Todo.id" },
        transition: "complete-todo",
        errors: [],
      },
    ],
    reactions: [],
    journeys: [
      {
        id: "manage-todos",
        actor: "member",
        goal: "TODOを管理する",
        steps: [{ usecase: "create-todo" }, { usecase: "complete-todo" }],
      },
    ],
    ui: {
      components: [
        {
          id: "todo-selector",
          description: "TODO一覧から選択",
          sources: [{ entity: "Todo", matching: ["active"], fields: ["title", "status"] }],
          inputs: [],
          transforms: [],
          displays: [],
          outputs: [{ name: "todoId", type: "Todo.id" }],
        },
      ],
      views: [
        {
          id: "todo-list",
          components: ["todo-selector"],
          actions: [
            {
              usecase: "complete-todo",
              inputFrom: { todoId: "todo-selector.todoId" },
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe("semver", () => {
  it("compares equal versions", () => {
    expect(compareSemver("0.1.0", "0.1.0")).toBe(0);
  });
  it("compares major", () => {
    expect(compareSemver("1.0.0", "2.0.0")).toBe(-1);
    expect(compareSemver("2.0.0", "1.0.0")).toBe(1);
  });
  it("compares minor", () => {
    expect(compareSemver("0.1.0", "0.2.0")).toBe(-1);
    expect(compareSemver("0.2.0", "0.1.0")).toBe(1);
  });
  it("compares patch", () => {
    expect(compareSemver("0.1.0", "0.1.1")).toBe(-1);
    expect(compareSemver("0.1.1", "0.1.0")).toBe(1);
  });
});

describe("valid spec", () => {
  it("passes with no issues", () => {
    const result = validate(minimalSpec());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes with query usecase (no transition)", () => {
    const spec = minimalSpec();
    spec.usecases.push({
      id: "list-todos",
      description: "TODO一覧を表示する",
      actor: "member",
      target: { kind: "single", entity: "Todo" },
      input: {},
      errors: [],
    });
    spec.journeys[0].steps.push({ usecase: "list-todos" });
    const result = validate(spec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("version check", () => {
  it("rejects unsupported spec version", () => {
    const result = validate(minimalSpec({ webappSpec: "99.0.0" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rule).toBe("version.unsupported");
  });

  it("skips rules when spec version is older than all rules", () => {
    const result = validate(minimalSpec({ webappSpec: "0.0.1" }));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});

describe("uniqueness", () => {
  it("detects duplicate entity ids", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({ ...spec.domain.entities[0] });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "unique.entity-id")).toBe(true);
  });

  it("detects state-trait name collision", () => {
    const spec = minimalSpec();
    spec.domain.entities[0].traits = [
      { name: "active", description: "same as state", derivedFrom: { field: "status", equals: "active" } },
    ];
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "unique.state-trait-collision")).toBe(true);
  });
});

describe("references", () => {
  it("detects missing entity in transition", () => {
    const spec = minimalSpec();
    spec.domain.transitions[0].changes[0].entity = "NonExistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.entity")).toBe(true);
  });

  it("detects missing state in transition", () => {
    const spec = minimalSpec();
    spec.domain.transitions[0].changes[0].state.from = "nonexistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.state")).toBe(true);
  });

  it("detects missing actor in usecase", () => {
    const spec = minimalSpec();
    spec.usecases[0].actor = "nonexistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.actor")).toBe(true);
  });

  it("detects missing transition in usecase", () => {
    const spec = minimalSpec();
    spec.usecases[0].transition = "nonexistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.transition")).toBe(true);
  });

  it("detects missing usecase in journey", () => {
    const spec = minimalSpec();
    (spec.journeys[0].steps[0] as { usecase: string }).usecase = "nonexistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.usecase")).toBe(true);
  });

  it("detects missing component in view", () => {
    const spec = minimalSpec();
    spec.ui.views[0].components = ["nonexistent"];
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.component")).toBe(true);
  });

  it("detects missing field in ownership", () => {
    const spec = minimalSpec();
    (spec.domain.entities[0].ownership as { kind: "personal"; ownerField: string }).ownerField = "nonexistent";
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.field")).toBe(true);
  });

  it("detects missing field in datasource", () => {
    const spec = minimalSpec();
    spec.ui.components[0].sources[0].fields = ["nonexistent"];
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.field")).toBe(true);
  });

  it("detects missing matching state/trait in datasource", () => {
    const spec = minimalSpec();
    spec.ui.components[0].sources[0].matching = ["nonexistent"];
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "ref.state-trait")).toBe(true);
  });
});

describe("pseudo states", () => {
  it("allows _start as from state", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "create-todo",
      description: "TODO作成",
      changes: [{ entity: "Todo", state: { from: "_start", to: "active" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.errors.filter((e) => e.rule === "ref.state" || e.rule === "transition.pseudo-state")).toHaveLength(0);
  });

  it("allows _end as to state", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "delete-todo",
      description: "TODO削除",
      changes: [{ entity: "Todo", state: { from: "active", to: "_end" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.errors.filter((e) => e.rule === "ref.state" || e.rule === "transition.pseudo-state")).toHaveLength(0);
  });

  it("rejects _end as from state", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "bad-transition",
      description: "不正",
      changes: [{ entity: "Todo", state: { from: "_end", to: "active" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "transition.pseudo-state")).toBe(true);
  });

  it("rejects _start as to state", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "bad-transition",
      description: "不正",
      changes: [{ entity: "Todo", state: { from: "active", to: "_start" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "transition.pseudo-state")).toBe(true);
  });

  it("rejects _start as entity state name", () => {
    const spec = minimalSpec();
    spec.domain.entities[0].states.push({ name: "_start", field: "status", value: "start" });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "unique.reserved-state-name")).toBe(true);
  });

  it("rejects _end as entity state name", () => {
    const spec = minimalSpec();
    spec.domain.entities[0].states.push({ name: "_end", field: "status", value: "end" });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "unique.reserved-state-name")).toBe(true);
  });
});

describe("transitions", () => {
  it("detects missing relation for scope related", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({
      id: "Project",
      fields: [{ name: "status", type: "string" }],
      ownership: { kind: "shared" },
      states: [
        { name: "active", field: "status", value: "active" },
        { name: "archived", field: "status", value: "archived" },
      ],
      traits: [],
    });
    spec.domain.transitions.push({
      id: "archive-project",
      description: "プロジェクトをアーカイブ",
      changes: [
        { entity: "Project", state: { from: "active", to: "archived" }, scope: "target" },
        { entity: "Todo", state: { from: "active", to: "completed" }, scope: "related" },
      ],
      conditions: [],
    });
    // No relation between Project and Todo
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "transition.entity-relation")).toBe(true);
  });
});

describe("usecases", () => {
  it("detects transition target mismatch", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({
      id: "Project",
      fields: [{ name: "status", type: "string" }],
      ownership: { kind: "shared" },
      states: [{ name: "active", field: "status", value: "active" }],
      traits: [],
    });
    spec.usecases[0].target = { kind: "single", entity: "Project" };
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "usecase.transition-target")).toBe(true);
  });

  it("warns on anonymous actor accessing personal resource", () => {
    const spec = minimalSpec();
    spec.actors.push({ id: "anonymous", authState: { kind: "anonymous" } });
    spec.usecases[0].actor = "anonymous";
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "usecase.anonymous-ownership")).toBe(true);
  });

  it("detects followUp cycle", () => {
    const spec = minimalSpec();
    spec.usecases[0].followUps = [{ description: "self", usecase: "create-todo" }];
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "usecase.followup-cycle")).toBe(true);
  });
});

describe("ui", () => {
  it("detects invalid inputFrom format", () => {
    const spec = minimalSpec();
    spec.ui.views[0].actions[0].inputFrom = { todoId: "invalid-no-dot" };
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "view.input-mapping")).toBe(true);
  });

  it("detects missing component in inputFrom", () => {
    const spec = minimalSpec();
    spec.ui.views[0].actions[0].inputFrom = { todoId: "nonexistent.todoId" };
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "view.input-mapping")).toBe(true);
  });

  it("detects missing output in inputFrom", () => {
    const spec = minimalSpec();
    spec.ui.views[0].actions[0].inputFrom = { todoId: "todo-selector.nonexistent" };
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "view.input-mapping")).toBe(true);
  });

  it("detects unmapped usecase input", () => {
    const spec = minimalSpec();
    spec.ui.views[0].actions[0].inputFrom = {};
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "view.usecase-input")).toBe(true);
  });
});

describe("reactions", () => {
  it("detects trigger entity mismatch", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({
      id: "User",
      fields: [{ name: "name", type: "string" }],
      ownership: { kind: "shared" },
      states: [],
      traits: [],
    });
    spec.reactions = [
      {
        trigger: { usecase: "complete-todo", entity: "User" },
        when: [],
        notify: { external: "test-log" },
        description: "test reaction",
      },
    ];
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "reaction.entity")).toBe(true);
  });
});

describe("unused", () => {
  it("warns on unused transition", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "unused-transition",
      description: "使われない",
      changes: [{ entity: "Todo", state: { from: "completed", to: "active" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "unused.transition")).toBe(true);
  });

  it("warns on unused actor", () => {
    const spec = minimalSpec();
    spec.actors.push({ id: "unused-actor", authState: { kind: "authenticated", roles: ["unused"] } });
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "unused.actor")).toBe(true);
  });
});

describe("journeys", () => {
  it("warns on actor mismatch in journey step", () => {
    const spec = minimalSpec();
    spec.actors.push({ id: "admin", authState: { kind: "authenticated", roles: ["admin"] } });
    spec.usecases.push({
      id: "admin-action",
      description: "管理者操作",
      actor: "admin",
      target: { kind: "single", entity: "Todo" },
      input: {},
      transition: "complete-todo",
      errors: [],
    });
    spec.journeys[0].steps.push({ usecase: "admin-action" });
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "journey.actor-mismatch")).toBe(true);
  });
});

describe("actors", () => {
  it("warns when no anonymous actor is defined", () => {
    const spec = minimalSpec();
    spec.actors = spec.actors.filter((a) => a.authState.kind !== "anonymous");
    const result = validate(spec);
    expect(result.warnings.some((w) => w.rule === "actor.no-anonymous")).toBe(true);
  });

  it("does not warn when anonymous actor exists", () => {
    const spec = minimalSpec();
    spec.actors.push({ id: "anonymous", authState: { kind: "anonymous" } });
    const result = validate(spec);
    expect(result.warnings.filter((w) => w.rule === "actor.no-anonymous")).toHaveLength(0);
  });
});

describe("entities", () => {
  it("detects entity with no states", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({
      id: "Tag",
      fields: [{ name: "name", type: "string" }],
      ownership: { kind: "shared" },
      states: [],
      traits: [],
    });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "entity.no-states")).toBe(true);
  });

  it("passes when all entities have states", () => {
    const result = validate(minimalSpec());
    expect(result.errors.filter((e) => e.rule === "entity.no-states")).toHaveLength(0);
  });
});

describe("entity lifecycle", () => {
  it("detects entity with no creation path", () => {
    const spec = minimalSpec();
    spec.domain.entities.push({
      id: "Project",
      fields: [{ name: "status", type: "string" }],
      ownership: { kind: "shared" },
      states: [{ name: "active", field: "status", value: "active" }],
      traits: [],
    });
    const result = validate(spec);
    expect(result.errors.some((e) => e.rule === "transition.no-creation")).toBe(true);
  });

  it("passes when entity has creation transition", () => {
    const result = validate(minimalSpec());
    expect(result.errors.filter((e) => e.rule === "transition.no-creation")).toHaveLength(0);
  });

  it("reports info when entity has no deletion path", () => {
    const result = validate(minimalSpec());
    expect(result.infos.some((i) => i.rule === "transition.no-deletion")).toBe(true);
  });

  it("does not report info when entity has deletion transition", () => {
    const spec = minimalSpec();
    spec.domain.transitions.push({
      id: "delete-todo",
      description: "TODOを削除する",
      changes: [{ entity: "Todo", state: { from: "active", to: "_end" }, scope: "target" }],
      conditions: [],
    });
    const result = validate(spec);
    expect(result.infos.filter((i) => i.rule === "transition.no-deletion")).toHaveLength(0);
  });
});

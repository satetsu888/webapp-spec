---
name: webapp-spec
description: TRIGGER when the user asks to validate, view, inspect, or create a WebAppSpec JSON file. Uses `@webapp-spec/cli` to validate spec files, open the browser viewer, print summary info, or output the JSON Schema. Also covers building a spec from scratch through structured information gathering.
---
# webapp-spec

`@webapp-spec/cli` provides the `wspec` command for working with WebAppSpec files — a format that defines web applications as machine-readable data structures.

## Commands

### validate — Check a spec file for errors

Runs both structural (JSON Schema) and semantic (referential integrity, rule violations) validation.

```bash
npx @webapp-spec/cli validate $ARGUMENTS
```

- Exit code 0 = passed, 1 = failed
- Issues are reported in three severity levels: error, warning, info
- Validation passes as long as there are no errors (warnings and infos are non-blocking)
- Each error includes a `[rule]` tag and an `at path` pointer to the location in the spec

Always run validate after creating or editing a spec file to verify consistency.

### view — Open the browser viewer

Starts a local HTTP server serving the spec viewer and opens the browser automatically.

```bash
npx @webapp-spec/cli view $ARGUMENTS
npx @webapp-spec/cli view $ARGUMENTS --no-open   # don't open browser
npx @webapp-spec/cli view $ARGUMENTS -p 8080     # custom port
```

- The server runs until Ctrl+C (long-running process)
- When running in the background, use `&` and keep track of the PID
- Default port is 3000; if occupied, an available port is selected automatically

### info — Print spec summary

Display a quick overview of the spec's structure in the terminal. Useful for a fast check without opening the viewer.

```bash
npx @webapp-spec/cli info $ARGUMENTS
```

Shows counts for entities, relations, transitions, actors, operations, side effects, specs, scenarios, components, views, and fixtures.

### schema — Output the JSON Schema

Prints the WebAppSpec JSON Schema to stdout. Useful for editor integration or piping to other tools.

```bash
npx @webapp-spec/cli schema
```

## Building a spec from scratch

When the user wants to create a new WebAppSpec file, gather information in the following order. Each phase builds on the previous one. Do not try to collect everything at once — work through the phases iteratively, confirming with the user before moving to the next.

### Phase 1: App overview

Ask the user to describe the application in broad terms. The goal is to identify the domain and core behavior.

Questions to ask:
- What does the app do? What problem does it solve?
- Who are the different types of users? (e.g., anonymous visitors, logged-in members, admins, external systems)
- What are the main things (entities) users create, read, update, or delete?

From this you can derive: the `name`, `version`, initial `entities` list, and `actors`.

### Phase 2: Domain modeling (entities, relations, transitions)

For each entity identified in Phase 1, gather:

**Fields:**
- What data does each entity hold? (name, type, required/optional)
- Types are simple strings: `string`, `number`, `boolean`, `date`, `datetime`, or a reference like `User.id`

**Ownership:**
- Who owns this entity? One specific user (`personal` + ownerField), a group (`group` + groupField), multiple participants (`participants` + participantFields), or anyone (`shared`)?

**States:**
- What explicit lifecycle states does this entity have? (e.g., draft/published/archived, active/completed)
- Each state maps to a specific field and value

**Traits (if applicable):**
- Are there computed/derived properties? (e.g., "overdue" = incomplete + past due date)
- Traits are derived from conditions on fields, not directly settable

**Relations between entities:**
- How do entities relate? (hasMany, belongsTo, manyToMany)

**Transitions:**
- How does each entity move between states? What triggers each transition?
- Use `_start` for creation (from nothing to initial state) and `_end` for deletion
- A single transition can change multiple entities at once (e.g., archiving a project also cancels its tasks)

### Phase 3: Actors and operations

**Actors:**
- Define each user type with their authentication state
- `anonymous` = not logged in, `authenticated` with roles = logged in
- External systems (cron jobs, webhooks) are also actors with `authenticated` + system role
- Always include an `anonymous` actor unless the app requires login for everything

**Operations:**
- For each action a user can take, define: who (actor), what entity (target), what input is needed, what transition happens, and what can go wrong (errors)
- Target is either `single` (one entity) or `collection` (a filtered set via `matching` states/traits)
- `scopeByActor` restricts access to entities owned by the acting user
- Operations without a `transition` are read-only (queries/listings)

**Side effects (if applicable):**
- Do any operations trigger notifications, emails, or external calls?
- Each side effect has a trigger (operation + entity), optional conditions (`when`), and a notification target (actor, entity owner, or external system)

**Follow-ups (if applicable):**
- Does completing one operation automatically trigger another? (e.g., after creating an order, a system actor processes payment)

### Phase 4: Business rules (specs)

Ask whether there are conditional constraints that vary by user plan, role, or entity state:
- Are there limits on how many of something a user can create? (e.g., free plan: 5 projects, pro plan: unlimited)
- Are certain features or field values restricted by plan/role?

Each spec contains rules with a `when` condition and a `constraint` (maxCount on a relation, maxCount on owned entities, or allowedValues on a field).

Skip this section if the app has no plan-based or role-based limits.

### Phase 5: Scenarios

Ask the user to walk through the main user journeys:
- What does a brand-new user do first? (onboarding)
- What are the core daily workflows?
- Are there background/automated flows? (system actor scenarios)

Each scenario is a sequence of steps. Each step references a `view` and optionally an `action` (operation). Background steps reference an `operation` and an `actor` directly.

Scenarios can have `variants` for alternative paths (error cases, edge cases).

### Phase 6: UI (components and views)

**Components** define what data is displayed and what input is collected:
- `sources`: what entity data does this component fetch? Which states does it filter by (`matching`)? Which fields does it display?
- `inputs`: what fields does the user fill in?
- `transforms`: any data conversions between sources/inputs and displays/outputs?
- `displays`: what fields are shown to the user?
- `outputs`: what values does this component provide to operations? (e.g., a selected entity's ID)

**Views** compose components and wire them to operations:
- Which components appear on this screen?
- Which operations can be triggered, and where does each operation input come from? (`inputFrom` maps operation input fields to `componentId.outputField`)

### Phase 7: Fixtures (optional)

If the user wants simulation or test data, create sample entity instances:
- A few representative instances per entity covering different states
- Realistic field values

### Iterative validation

After each phase, write the partial spec to the JSON file and run validation:

```bash
npx @webapp-spec/cli validate path/to/spec.json
```

Fix any errors before proceeding to the next phase. Common errors:
- `ref.*` — a reference to a nonexistent entity, field, state, actor, transition, component, or view
- `unique.*` — duplicate IDs or names
- `transition.no-creation` — an entity has no `_start` transition (no way to create it)
- `unused.*` — defined but unused elements (warnings, not errors)

### Key design principles

- **Domain describes structure, Specs describe business rules.** Don't put plan limits or conditional constraints in transitions — put them in specs.
- **Operations are domain actions, not HTTP endpoints.** Think "what does the user do" not "what API do I call." Implementation details (REST/GraphQL/RPC) are decided later.
- **States are explicit, Traits are derived.** If a property changes via a transition, it's a state. If it's computed from other fields, it's a trait.
- **`_start` and `_end` are reserved pseudo-states.** Use `_start` in `from` only (creation) and `_end` in `to` only (deletion). Never define them in an entity's `states` array.

## Workflow patterns

### After editing a spec file

Run validate to check for errors. If errors are found, use the `[rule]` tag and `at path` to locate and fix the issue.

```bash
npx @webapp-spec/cli validate path/to/spec.json
# Example error:
#   [ref.entity] Operation "createPost" references unknown entity "Postt"
#     at usecases.operations[3].target.entity
```

### Quick inspection

Use `info` for a terminal summary, or `view` to browse interactively in the browser.

```bash
npx @webapp-spec/cli info path/to/spec.json
npx @webapp-spec/cli view path/to/spec.json
```

## Notes

- `view` is a long-running process. Running it in the foreground blocks the shell. Use `&` for background execution and save the PID for cleanup.
- Validation is two-stage: JSON Schema structural check first, then semantic referential integrity check. If schema errors exist, semantic checks are skipped.
- The spec file format conforms to the JSON Schema output by `npx @webapp-spec/cli schema`.

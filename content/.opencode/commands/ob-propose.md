---
description: Parse a work item or idea and propose a change plan with enriched task assignments.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

**If a work item URL is provided** (GitHub Issue or Azure DevOps work item): load `@ob-userstory` skill and fetch the work item via CLI before continuing. Platform is set in `.opencode/opencode-onboard.json` `wizard.platform`. If platform is `none`, skip this step and work from direct user input.

**Step 0 - Check for unarchived changes**

Before proposing a new change, inspect `openspec/changes/` (ignore `openspec/changes/archive`).
If any unarchived change (`us-{id}-{slug}`) folders exist, list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the proposal or stop to archive the change first? [continue/stop]
```

If the user answers `stop`, end the command without generating a proposal.
If the user answers `continue`, proceed to the next step.

Load `@openspec-propose` skill and follow its instructions.

> ⚠️ **CHECKPOINT — `tasks.md` was just written. STOP. Do NOT show the plan yet. You MUST complete the enrichment below before continuing. Skipping this breaks `/ob-apply`.**

1. List every `*-engineer.md` file in `.opencode/agents/`. For each file read:
   - `description:` from the YAML frontmatter — the engineer's specialization summary
   - `## Abilities` section — the skills listed under Development, Testing, Infrastructure (e.g. `@nodejs-backend`, `@secure-nextjs-api-routes`)
   Build a map of `agent-name → { description, abilities }`.
2. For each task, compare the task text and domain against every engineer's description AND abilities. Pick the engineer whose combined profile most closely matches. Only use `basic-engineer` if no specialist is a clear fit. **The model follows the agent** — each engineer carries its own model (light work → `basic-engineer`, which runs on a cheap/fast model; complex work → a specialist on a capable model). You do not assign a model per task.
3. Derive **`depends_on`** for each task — the OpenSpec task IDs (`N.M`) it logically needs completed first (a task that consumes another's output: UI needs its RPC, tests need the code, a seed needs its migration). Root tasks get `[]`. Reference the IDs OpenSpec already generated; never invent new ones.
4. Derive **`touches`** for each task — the file path(s)/glob(s) it will create or modify (the task text usually names them, e.g. "Modify src/board/components/CreateForm.tsx"). This lets `/ob-apply` serialize same-file tasks that have no logical dependency. Include net-new files.
5. Annotate each task line in-place with all three fields:

```
- [ ] <task text> <!-- agent: <name>, depends_on: [<ids>], touches: [<globs>] -->
```

Example result (note same-file tasks like 1.1/1.2 share `touches`, so `/ob-apply` runs them sequentially even with no `depends_on` between them):

```
- [ ] 1.1 Add Project model to schema <!-- agent: backend-engineer, depends_on: [], touches: [src/types.ts] -->
- [ ] 1.2 Add projectId field to LoopOptions <!-- agent: backend-engineer, depends_on: [], touches: [src/types.ts] -->
- [ ] 2.1 Project RPC endpoints <!-- agent: backend-engineer, depends_on: [1.1], touches: [src/rpc/project/**] -->
- [ ] 3.1 Accept page UI <!-- agent: frontend-engineer, depends_on: [2.1], touches: [src/board/components/CreateForm.tsx] -->
- [ ] 3.2 i18n keys for invitation flow <!-- agent: basic-engineer, depends_on: [3.1], touches: [src/i18n/**] -->
- [ ] 4.1 Run typecheck and fix errors <!-- agent: basic-engineer, depends_on: [2.1,3.1], touches: [] -->
```

`/ob-apply` reads these annotations to build conflict-free waves: `depends_on` gates ordering, `touches` keeps concurrent agents file-disjoint, and the chosen `agent` determines the model. **`depends_on` is mandatory; `touches` is a best-effort hint** that codegraph impact refines at apply time.

**After enrichment, show the plan:** change name, total task count, full task list with agent and dependency annotations.

**Stop.** Ask the user: "Ready to implement? Run `/ob-apply` to start." Do NOT run `/ob-apply` automatically.

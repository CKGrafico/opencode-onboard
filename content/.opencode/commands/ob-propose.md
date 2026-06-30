---
description: Parse a work item or idea and propose a change plan with enriched task assignments.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->


**Step 0.a - Check for unarchived changes**

**IMPORTANT**: Never skip this step. User must give a response before proceeding.

Before proposing a new change, inspect `openspec/changes/` (ignore `openspec/changes/archive`). 
If any folder (`us-{id}-{slug}`) exist in `openspec/changes/`, list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the proposal or stop to archive the change first? [continue/stop]
```

Wait for the user to respond: 
- If the user answers `stop`, end the command without generating a proposal.
- If the user answers `continue`, proceed to the next step.

**Step 0.b - Load proposal skill**

**If a work item URL is provided** (GitHub Issue or Azure DevOps work item): load `@ob-userstory` skill and fetch the work item via CLI before continuing. Platform is set in `.opencode/opencode-onboard.json` `wizard.platform`. If platform is `none`, skip this step and work from direct user input.

Load `@openspec-propose` skill and follow its instructions.

> ⚠️ **CHECKPOINT — `tasks.md` was just written. STOP. Do NOT show the plan yet. You MUST complete the enrichment below before continuing. Skipping this breaks `/ob-apply`.**

<!-- OB-CMD-CODEGRAPH-START -->
Use codegraph MCP for code intelligence:
- Use `codegraph_search` to understand the real file/symbol landscape for the proposed tasks.
- Use `codegraph_impact` to trace which files each task truly affects — this makes `touches` annotations accurate instead of guessed.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP for persistent context:
- `search` for any prior exploration notes or decisions related to this change that `/ob-explore` may have stored.
- Write the proposal context to a `change-{slug}-context` note so `/ob-apply` can pick it up for subagent spawns.
<!-- OB-CMD-MEMORY-END -->

1. List every `*-engineer.md` file in `.opencode/agents/`. For each file read:
   - `description:` from the YAML frontmatter — the engineer's specialization summary
   - `## Abilities` section — the skills listed under Development, Testing, Infrastructure (e.g. `@nodejs-backend`, `@secure-nextjs-api-routes`)
   Build a map of `agent-name → { description, abilities }`.
2. For each task, compare the task text and domain against every engineer's description AND abilities. Pick the engineer whose combined profile most closely matches. Only use `basic-engineer` if no specialist is a clear fit.
3. Pick a **tier** for each task based on complexity:
   - `build` — complex code: data models, APIs, auth logic, core business logic, UI components
   - `fast` — light work: i18n keys, config changes, env variables, navigation links, simple markup, verification runs
   - `plan` — reserved for orchestration, do not use for implementation tasks
   The tier suffix is appended to the agent name with a dot (e.g. `backend-engineer.build`). This is the agent name you write in the annotation — the `ob-subagent-tiers` plugin resolves the model at startup from `wizard.models[<tier>]`.
4. Derive **`depends_on`** for each task — the OpenSpec task IDs (`N.M`) it logically needs completed first (a task that consumes another's output: UI needs its RPC, tests need the code, a seed needs its migration). Root tasks get `[]`. Reference the IDs OpenSpec already generated; never invent new ones.
5. Derive **`touches`** for each task — the file path(s)/glob(s) it will create or modify (the task text usually names them, e.g. "Modify src/board/components/CreateForm.tsx"). This lets `/ob-apply` serialize same-file tasks that have no logical dependency. Include net-new files.
6. Annotate each task line in-place with all three fields:

```
- [ ] <task text> <!-- agent: <name>, depends_on: [<ids>], touches: [<globs>] -->
```

Example result (note same-file tasks like 1.1/1.2 share `touches`, so `/ob-apply` runs them sequentially even with no `depends_on` between them; tier suffix encodes the model):

```
- [ ] 1.1 Add Project model to schema <!-- agent: backend-engineer.build, depends_on: [], touches: [src/types.ts] -->
- [ ] 1.2 Add projectId field to LoopOptions <!-- agent: backend-engineer.build, depends_on: [], touches: [src/types.ts] -->
- [ ] 2.1 Project RPC endpoints <!-- agent: backend-engineer.build, depends_on: [1.1], touches: [src/rpc/project/**] -->
- [ ] 3.1 Accept page UI <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/board/components/CreateForm.tsx] -->
- [ ] 3.2 i18n keys for invitation flow <!-- agent: frontend-engineer.fast, depends_on: [3.1], touches: [src/i18n/**] -->
- [ ] 4.1 Run typecheck and fix errors <!-- agent: basic-engineer.fast, depends_on: [2.1,3.1], touches: [] -->
```

`/ob-apply` reads these annotations to build conflict-free waves: `depends_on` gates ordering, `touches` keeps concurrent agents file-disjoint, and the tier suffix in `agent` determines the model (resolved at startup by the `ob-subagent-tiers` plugin). **`depends_on` is mandatory; `touches` is a best-effort hint** that codegraph impact refines at apply time.

**After enrichment, show the plan:** change name, total task count, full task list with agent (including tier suffix) and dependency annotations.

<!-- OB-CMD-MEMORY-START -->
After showing the plan:
- `write_note` with title `proposal-{change-slug}` containing the change id, task count, and agent+tier assignments. This lets `/ob-apply` verify the plan on resume.
<!-- OB-CMD-MEMORY-END -->

**Stop.** Ask the user: "Ready to implement? Run `/ob-apply` to start." Do NOT run `/ob-apply` automatically.

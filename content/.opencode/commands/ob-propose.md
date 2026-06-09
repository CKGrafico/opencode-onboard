---
description: Parse a work item or idea and propose a change plan with enriched task assignments.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

**If a work item URL is provided** (GitHub Issue or Azure DevOps work item): load `@ob-userstory` skill and fetch the work item via CLI before continuing. Platform is set in `.opencode/opencode-onboard.json` `wizard.platform`. If platform is `none`, skip this step and work from direct user input.

Load `@openspec-propose` skill and follow its instructions.

> ⚠️ **CHECKPOINT — `tasks.md` was just written. STOP. Do NOT show the plan yet. You MUST complete the enrichment below before continuing. Skipping this breaks `/ob-apply`.**

1. List every `*-engineer.md` file in `.opencode/agents/`. For each file read:
   - `description:` from the YAML frontmatter — the engineer's specialization summary
   - `## Abilities` section — the skills listed under Development, Testing, Infrastructure (e.g. `@nodejs-backend`, `@secure-nextjs-api-routes`)
   Build a map of `agent-name → { description, abilities }`.
2. For each task, compare the task text and domain against every engineer's description AND abilities. Pick the engineer whose combined profile most closely matches. Only use `basic-engineer` if no specialist is a clear fit.
3. Read `.opencode/opencode-onboard.json` → `wizard.models`. It has three keys: `build` (heavy implementation), `fast` (light/simple tasks), `plan` (orchestration). For each task, pick the most appropriate model:
   - `build` — complex code: data models, APIs, auth logic, core business logic, UI components
   - `fast` — light work: i18n keys, config changes, env variables, navigation links, simple markup, verification runs
   - `plan` — reserved for orchestration, do not use for implementation tasks
4. Annotate each task line in-place:

```
- [ ] <task text> <!-- agent: <name>, model: <id> -->
```

Example result (each task independently picks agent + model):

```
- [ ] Add Invitation model to Prisma schema <!-- agent: backend-engineer, model: opencode/big-pickle -->
- [ ] Create invitation accept page UI <!-- agent: frontend-engineer, model: opencode/big-pickle -->
- [ ] Add i18n keys for invitation flow <!-- agent: frontend-engineer, model: opencode/qwen3.6-plus -->
- [ ] Run pnpm typecheck and fix errors <!-- agent: basic-engineer, model: opencode/qwen3.6-plus -->
```

`/ob-apply` step 6 reads these annotations to spawn the right agent with the right model — no guessing at implementation time.

**After enrichment, show the plan:** change name, total task count, full task list with agent and model annotations.

**Stop.** Ask the user: "Ready to implement? Run `/ob-apply` to start." Do NOT run `/ob-apply` automatically.

---
description: Parse a work item or idea and propose a change plan with enriched task assignments.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

**If a work item URL is provided** (GitHub Issue or Azure DevOps work item): load `@ob-userstory` skill and fetch the work item via CLI before continuing. Platform is set in `.opencode/opencode-onboard.json` `wizard.platform`. If platform is `none`, skip this step and work from direct user input.

Load `@openspec-propose` skill and follow its instructions.

> ⚠️ **CHECKPOINT — `tasks.md` was just written. STOP. Do NOT show the plan yet. You MUST complete the enrichment below before continuing. Skipping this breaks `/ob-apply`.**

1. Read `.opencode/agents/`. For each task, pick the most domain-relevant engineer (skip any orchestration-only agents).
2. Read `.opencode/opencode-onboard.json` → `wizard.models.build` for the implementation model.
3. Annotate each task line in-place:

```
- [ ] <task text> <!-- agent: <name>, model: <id> -->
```

Example result:

```
- [ ] Implement JWT authentication <!-- agent: backend-engineer, model: claude-sonnet-4-5 -->
- [ ] Add login form component <!-- agent: frontend-engineer, model: claude-sonnet-4-5 -->
```

`/ob-apply` step 6 reads these annotations to spawn the right agent with the right model — no guessing at implementation time.

**After enrichment, show the plan:** change name, total task count, full task list with agent and model annotations.

**Stop.** Ask the user: "Ready to implement? Run `/ob-apply` to start." Do NOT run `/ob-apply` automatically.

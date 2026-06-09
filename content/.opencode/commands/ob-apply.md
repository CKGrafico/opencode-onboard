---
description: Implement tasks from an OpenSpec change via ensemble agent team.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

Load `@openspec-apply-change` skill and follow its instructions, replacing **Step 6 (Implement)** with the protocol below.

---

**Step 6 — Implement via ensemble. Replace the default step 6 with this protocol.**

> **Root cause of idle agents: missing task IDs.** An agent only claims a task when the exact task ID is in its spawn prompt AND its start message. No ID = agent sits idle. This is the single most important rule in this protocol.

**1. Branch.** Create `feature/{id}-{slug}` if not already on one.

**2. Team.** `team_create "<change>-<4digits>"`. Monitor: http://localhost:4747/

**3. Board.** Add ALL tasks before spawning. Dependency order matters — you cannot reference a task ID until its `team_tasks_add` call returns.
```
team_tasks_add tasks:[
  { content: "<task text from tasks.md>", priority: "high" },
  { content: "<dependent task>", priority: "high", depends_on: ["<real-id>"] }
]
```
Save every returned task ID. Do not proceed until the full board is built.

**4. Context.** Before spawning, gather context to include in each spawn prompt:
- Use `codegraph_search` and `codegraph_impact` to find relevant symbols and files for each task domain.
- Use basic-memory (`search` to retrieve prior decisions and context, `write_note` to store new ones) so agents share knowledge across the session.

**5. Spawn.** For each task group:
- Agent and model come from the task annotations in `tasks.md` (set during `/ob-propose`). If missing: scan `.opencode/agents/` for the best match; read `.opencode/opencode-onboard.json` `wizard.models` — use `build` for engineers.
- `team_spawn name:"<x>" agent:"<file>" model:"<id>" claim_task:"<task-id>" prompt:"..."`
- Spawn prompt must start with: `Claim [<task-id>]: <task text>.` followed by relevant context.
- Spawn sequentially — wait for each spawn result before the next.
- Immediately after each spawn: `team_message to:"<x>" text:"Claim now: [<task-id>] <task text>"`

**6. Wait.** Tell the user what is running. STOP. Do not poll. Teammates message you when done or blocked.

**7. Reassign or close.**
- `team_results from:"<name>"` to read. `team_tasks_list` to check remaining tasks.
- More tasks for this agent → send next batch with literal IDs via `team_message`.
- No more tasks → `team_shutdown` → `team_merge`. On merge conflict: `git stash`, retry, `git stash pop`.
- Agent idle (never claimed) → resend task ID once. Still idle → shutdown + respawn once with a shorter prompt. Still fails → continue in main session.
- All agents done, tasks remain → spawn a new wave (back to step 5).

**8. Verify.** Spawn the best available engineer with `worktree:false`. Wait → `team_results` → fix blockers → `team_shutdown`.

**9. Mark done.** Update `tasks.md` checkboxes. Run `openspec status --change "<name>" --json`.

**10. Cleanup.** Show progress (N/M tasks). `team_cleanup`.

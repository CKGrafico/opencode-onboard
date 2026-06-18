---
description: Implement tasks from an OpenSpec change via native parallel subagent waves.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

Load `@openspec-apply-change` skill and follow its instructions, replacing **Step 6 (Implement)** with the protocol below.

---

**Step 6 — Implement via native subagent waves. Replace the default step 6 with this protocol.**

You are the **lead**. You orchestrate from this session only; you spawn workers with the native `task` tool. Workers are **ephemeral** (one batch, then they exit) and **navigable** (`ctrl+x ↓`, `←`/`→`). There is no board, no claiming, no merging, no external dashboard.

> **Core rule — push, don't pull.** A worker is born with its work: every `task()` spawn prompt contains the exact task IDs and text it must do. There is no claim step, so a worker can never sit idle waiting for an assignment.

**1. Branch.** Create `feature/{change-slug}` if not already on one.

**2. Load the plan.** Parse `tasks.md`. Each task carries `<!-- agent, modeltype, depends_on, touches -->` (from `/ob-propose`). Read `.opencode/opencode-onboard.json` → `wizard.maxConcurrentAgents` (the wave cap, 1–5) and `wizard.models` (for reference).

**3. Hydrate the Todo board.** `todowrite` one item per task: `pending`. The Todo pane is your live board — but it is a **projection only**. Never read it for recovery; rebuild it from `tasks.md` + git + `.opencode/.ob-run.json`.

**4. MCP health + degradation.** Before each wave, confirm codegraph and basic-memory respond. Degrade automatically:
- **codegraph down/slow** → compute file-disjointness from `touches:` globs + `git diff` instead of `codegraph_impact`.
- **basic-memory down** → pass results inline through your context + read `.opencode/.ob-run.json`; skip note writes.
Tell the user when you degrade.

**5. The wave loop.** Repeat until no tasks remain:

```
eligible = unchecked tasks whose every depends_on is DONE (committed/checked)
if eligible is empty but tasks remain  → STALL: report blocked tasks + the failed
                                          dependency causing it, then STOP.
groups   = pack eligible tasks that share a file (touches / codegraph_impact)
           into ONE worker each, to run sequentially; group key = (file-set, modeltype)
wave     = pick groups whose file-sets are pairwise DISJOINT, capped at maxConcurrentAgents
           (you enforce the cap — opencode runs every task() you emit at once)
```

**6. Context per group.** For each group, gather (when MCPs are healthy):
- `codegraph_search` / `codegraph_impact` for the relevant symbols/files.
- basic-memory `search` for prior decisions and the `change-<slug>-context` note (write that context note once before wave 1).

**7. Spawn the wave — one assistant turn, multiple `task()` calls (they run in parallel).** For each group:
- `subagent_type` = `<agent>-<modeltype>` (e.g. `backend-engineer-build`). If that variant file is absent, fall back to `basic-engineer-<modeltype>`, then `basic-engineer`.
- `description` = `"<task-ids> — <short label>"` (e.g. `"2.1,2.2 — RPC endpoints"`) so the subagent is legible in the `←`/`→` list and the monitor.
- `prompt` must contain: the exact task IDs + text, the gathered context, the rule to do the tasks in dependency order, and to write a `task-<id>-result` note to basic-memory on finish.
- Flip each spawned task's Todo item to `in_progress`.

**8. Collect the wave.** Each foreground `task()` returns its result to you. For each group:
- **success** → `git add` the group's `touches` paths and commit `"{ids}: {summary}"`; mark its Todo items `completed`; check `[x]` in `tasks.md`.
- **error / empty** → revert that group's impact paths (`git checkout -- <paths>`), mark `failed`, record reason (basic-memory note or `.ob-run.json`), then **retry once** (fresh spawn, shorter prompt). Still failing → leave failed and surface to the user; do not loop.
- A failed group only blocks its dependents; unrelated tasks keep flowing.

**9. Progress guard.** If a full wave moved **zero** tasks to DONE → STOP (do not re-spawn the identical failing set). Otherwise recompute `eligible` and loop to step 5.

**10. Verify.** In this (lead) session, run the change's tests/lint/build. On failure, reopen the offending tasks (uncheck, mark failed) → they re-enter `eligible` → run another wave.

**11. Close.** Mark all `tasks.md` checkboxes, run `openspec status --change "<name>" --json`, report progress (N/M tasks). The wave state in `.opencode/.ob-run.json` and basic-memory persists for resume.

> **Resume:** re-running `/ob-apply` after any crash recomputes DONE / FAILED / eligible from `tasks.md` + git + basic-memory + `.ob-run.json` and continues. State is on disk, not in this conversation.

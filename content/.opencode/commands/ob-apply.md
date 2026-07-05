---
description: Implement tasks from an OpenSpec change via native parallel subagent waves.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

Load `@openspec-apply-change` skill and follow its instructions, replacing **Step 6 (Implement)** with the protocol below.

---

**Step 6 — Implement via native subagent waves. Replace the default step 6 with this protocol.**

You are the **lead**. You orchestrate from this session only; you spawn workers with the native `task` tool. Workers are **ephemeral** (one batch, then they exit) and **navigable** (`ctrl+x ↓`, `←`/`→`). There is no board, no claiming, no merging, no external dashboard.

> **Core rule — push, don't pull.** A worker is born with its work: every `task()` spawn prompt contains the exact task IDs and text it must do. There is no claim step, so a worker can never sit idle waiting for an assignment.

**1. Branch.** Create `feature/{change-slug}` if not already on one.

**2. Load the plan.** Parse `tasks.md`. Each task carries `<!-- agent, depends_on, touches -->` (from `/ob-propose`). The agent name includes a tier suffix (e.g. `backend-engineer.build`, `basic-engineer.fast`) — the `ob-subagent-tiers` plugin resolved the model at startup from `wizard.models[<tier>]` and injected these tier-suffixed agents into the config. You do not worry about models. Read `.opencode/opencode-onboard.json` → `wizard.maxConcurrentAgents` (the wave cap, 1–5).

**3. Hydrate the Todo board.** `todowrite` one item per task: `pending`. **The Todo pane is the visible subagent board** (opencode plugins cannot draw a custom pane, so the native Todo widget is the live UI). While a task is in flight, its label must carry the worker — `<agent> · <model>` — so the pane shows which agent on which model is doing what. The Todo list is a **projection only**: never read it for recovery; rebuild it from `tasks.md` + git + `.opencode/.ob-run.json`.

**4. MCP health + degradation.** Before each wave, confirm codegraph and basic-memory MCP tools respond. Degrade automatically:
- **codegraph MCP down/slow** → compute file-disjointness from `touches:` globs + `git diff` instead of `codegraph_impact` MCP tool.
- **basic-memory MCP down** → pass results inline through your context + read `.opencode/.ob-run.json`; skip note writes.
Tell the user when you degrade.

**5. The wave loop.** Repeat until no tasks remain:

```
eligible = unchecked tasks whose every depends_on is DONE (committed/checked)
if eligible is empty but tasks remain  → STALL: report blocked tasks + the failed
                                          dependency causing it, then STOP.
groups   = pack eligible tasks that share a file (touches / codegraph_impact)
           into ONE worker each, to run sequentially (the worker uses the task's `agent`)
wave     = pick groups whose file-sets are pairwise DISJOINT, capped at maxConcurrentAgents
           (you enforce the cap — opencode runs every task() you emit at once)
```

**6. Context per group.** For each group, gather (when MCPs are healthy):
- `codegraph_search` / `codegraph_impact` MCP tools for the relevant symbols/files.
- basic-memory `search` MCP tool for prior decisions and the `change-<slug>-context` note (write that context note once before wave 1).

**7. Spawn the wave — one assistant turn, multiple `task()` calls (they run in parallel).** For each group:
- `subagent_type` = the task's `agent` **exactly as written** in `tasks.md` (e.g. `frontend-engineer.build`, `basic-engineer.fast`). This is a tier-suffixed agent injected at startup by the `ob-subagent-tiers` plugin — it carries the model from `wizard.models[<tier>]`. If that agent is missing (plugin not loaded or tier model unset), fall back to the base template agent (strip the `.<tier>` suffix, e.g. `frontend-engineer`) which inherits the lead's model. **Never** spawn the built-in `general` agent for implementation work — its model is wrong.
- `description` = `"<task-ids> — <short label>"` (e.g. `"2.1,2.2 — RPC endpoints"`) so the subagent is legible in the `←`/`→` list and the monitor.
- `prompt` must contain: the exact task IDs + text, and the gathered context (codegraph MCP results + relevant basic-memory MCP notes). The worker follows the **Engineer workflow** defined once in `@ob-generic-guardrails` (load abilities → implement in dependency order → write a `task-<id>-result` note → return a summary) — do not restate it in the prompt.
- Flip each spawned task's Todo item to `in_progress` and prefix its label with `<agent> — ` (e.g. `frontend-engineer.build — 2.1 Consolidate logic`) so the running worker is visible in the Todo pane. On completion, drop the prefix and mark `completed`.

**8. Collect the wave.** Each foreground `task()` returns its result to you. For each group:
- **success** → `git add` the group's `touches` paths and commit `"{ids}: {summary}"`; mark its Todo items `completed`; check `[x]` in `tasks.md`.
- **error / empty** → revert that group's impact: `git checkout -- <tracked paths>` for modified files AND `git clean -f -- <paths>` for net-new files the group created (checkout alone leaves them behind, poisoning the retry). Mark `failed` and record the reason in a basic-memory note (or a comment in `tasks.md` if memory is down — `.ob-run.json` is owned by the monitor plugin, never write it). Then **retry once** (fresh spawn, shorter prompt). Still failing → leave failed and surface to the user; do not loop.
- A failed group only blocks its dependents; unrelated tasks keep flowing.

**9. Progress guard.** If a full wave moved **zero** tasks to DONE → STOP (do not re-spawn the identical failing set). Otherwise recompute `eligible` and loop to step 5.

**10. Verify.** In this (lead) session, run the change's tests/lint/build. On failure, reopen the offending tasks (uncheck, mark failed) → they re-enter `eligible` → run another wave.

**11. Close.** Mark all `tasks.md` checkboxes, run `openspec status --change "<name>" --json`, report progress (N/M tasks). The wave state in `.opencode/.ob-run.json` and basic-memory MCP persists for resume.

> **Resume:** re-running `/ob-apply` after any crash recomputes DONE / FAILED / eligible from `tasks.md` + git + basic-memory MCP + `.ob-run.json` and continues. State is on disk, not in this conversation.

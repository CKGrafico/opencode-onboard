---
name: ob-plan-apply
description: Implement tasks from a plan. OpenSpec-annotated tasks (from ob-plan-propose) run as parallel subagent waves; Todo pane tasks (from /plan-quick) run sequentially in-session. Load when implementing a prepared plan. Invoked by the /plan-apply command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Apply

## Input

The caller provides (all optional):
- A **mode** (see below). Default: `interactive`.
- A `start_from` hint: `branch` (default, full protocol from step 1) or `load-plan` (the caller already created the feature branch; skip step 1).

## Modes

- **interactive** (default): report progress to the user and surface failures for their decision.
- **autonomous**: do not return control between waves; keep looping until every task is DONE or the progress guard / retry limit trips. On a stall or exhausted retry, stop the wave loop and report to the caller (whose failure policy governs). **When all tasks are DONE, the APPLY stage is complete — this is NOT the end of the run.** Hand control back to the caller (the `/plan-goal` pipeline) so it continues with the next phase (archive → evidence → output). Do not end the turn here; "report N/N tasks" is a stage boundary, not a finish line.

## Plan source detection

1. Check if an OpenSpec change exists: inspect `openspec/changes/` for an active change folder with a `tasks.md`.
2. If found and tasks have `<!-- agent` annotations (written by `ob-plan-propose`) → **OpenSpec mode** → follow the protocol below.
3. If no OpenSpec change exists, but there are `pending` items in the Todo pane (from `/plan-quick`) → **Simple mode** → skip to the Simple mode section.

---

## OpenSpec mode: parallel subagent waves

Load `@openspec-apply-change` skill and follow its instructions, replacing **Step 6 (Implement)** with the protocol below.

**Step 6: Implement via native subagent waves. Replace the default step 6 with this protocol.**

You are the **lead**. You orchestrate from this session only; you spawn workers with the native `task` tool. Workers are **ephemeral** (one batch, then they exit) and **navigable** (`ctrl+x ↓`, `←`/`→`). There is no board, no claiming, no merging, no external dashboard.

> **Core rule: push, don't pull.** A worker is born with its work: every `task()` spawn prompt contains the exact task IDs and text it must do. There is no claim step, so a worker can never sit idle waiting for an assignment.

**1. Branch.** Create `feature/{change-slug}` if not already on one. (Skip this step when the caller passed `start_from: load-plan`.)

**2. Load the plan.** Parse `tasks.md`. Each task carries `<!-- agent, depends_on, touches -->` (from `ob-plan-propose`). The agent name includes a tier suffix (e.g. `backend-engineer.build`, `frontend-engineer.fast`): the `ob-subagent-tiers` plugin resolved the model at startup from `models[<tier>]` and injected these tier-suffixed agents into the config. You do not worry about models. Read `.opencode/opencode-onboard.json` → `agents.maxConcurrent` (the wave cap, 1–5).

**3. Hydrate the Todo board.** `todowrite` one item per task: `pending`. **The Todo pane is the visible subagent board** (opencode plugins cannot draw a custom pane, so the native Todo widget is the live UI). While a task is in flight, its label must carry the worker: `<agent> · <model>`: so the pane shows which agent on which model is doing what. The Todo list is a **projection only**: never read it for recovery; rebuild it from `tasks.md` + git + `.opencode/.ob-run.json`.

**4. MCP health + degradation.** Before each wave, confirm codegraph and agentmemory MCP tools respond. Degrade automatically:
- **codegraph MCP down/slow** → compute file-disjointness from `touches:` globs + `git diff` instead of `codegraph_explore` MCP tool.
- **agentmemory MCP down** → pass results inline through your context + read `.opencode/.ob-run.json`; skip note writes.
Tell the user when you degrade.

**5. The wave loop.** Repeat until no tasks remain:

```
eligible = unchecked tasks whose every depends_on is DONE (committed/checked)
if eligible is empty but tasks remain  → STALL: report blocked tasks + the failed
                                          dependency causing it, then STOP.
groups   = pack eligible tasks that share a file (touches / codegraph_explore)
           into ONE worker each, to run sequentially (the worker uses the task's `agent`)
wave     = pick groups whose file-sets are pairwise DISJOINT, capped at maxConcurrentAgents
           (you enforce the cap: opencode runs every task() you emit at once)
```

**6. Context per group.** For each group, gather (when MCPs are healthy):
- `codegraph_explore` MCP tool for the relevant symbols/files.
- agentmemory `memory_smart_search` MCP tool for prior decisions and the `change-<slug>-context` note (write that context note once before wave 1).

**7. Spawn the wave: one assistant turn, multiple `task()` calls (they run in parallel).** For each group:
- `subagent_type` = the task's `agent` **exactly as written** in `tasks.md` (e.g. `frontend-engineer.build`, `backend-engineer.fast`). This is a tier-suffixed agent injected at startup by the `ob-subagent-tiers` plugin: it carries the model from `models[<tier>]`. If that agent is missing (plugin not loaded or tier model unset), fall back to the base template agent (strip the `.<tier>` suffix, e.g. `frontend-engineer`) which inherits the lead's model. **Never** spawn the built-in `general` agent for implementation work: its model is wrong. **Never** spawn `fullstack-engineer` — it is `mode: primary` (the user's planning agent), not a worker.
- `description` = `"<task-ids>: <short label>"` (e.g. `"2.1,2.2: RPC endpoints"`) so the subagent is legible in the `←`/`→` list and the monitor.
- `prompt` must contain: the exact task IDs + text, and the gathered context (codegraph MCP results + relevant agentmemory MCP notes). The worker follows the **Engineer workflow** defined once in `@ob-guardrails-generic` (load abilities → implement in dependency order → write a `task-<id>-result` note → return a summary): do not restate it in the prompt.
- Flip each spawned task's Todo item to `in_progress` and prefix its label with `<agent>: ` (e.g. `frontend-engineer.build: 2.1 Consolidate logic`) so the running worker is visible in the Todo pane. On completion, drop the prefix and mark `completed`.

**8. Collect the wave.** Each foreground `task()` returns its result to you. For each group:
- **success** → `git add` the group's `touches` paths and commit `"{ids}: {summary}"`; mark its Todo items `completed`; check `[x]` in `tasks.md`.
- **error / empty** → revert that group's impact: `git checkout -- <tracked paths>` for modified files AND `git clean -f -- <paths>` for net-new files the group created (checkout alone leaves them behind, poisoning the retry). Mark `failed` and record the reason in an agentmemory note (or a comment in `tasks.md` if memory is down: `.ob-run.json` is owned by the monitor plugin, never write it). Then **retry once** (fresh spawn, shorter prompt). Still failing → leave failed and surface it; do not loop.
- A failed group only blocks its dependents; unrelated tasks keep flowing.

**9. Progress guard.** If a full wave moved **zero** tasks to DONE → STOP (do not re-spawn the identical failing set). Otherwise recompute `eligible` and loop to step 5.

**10. Verify.** In this (lead) session, run the change's tests/lint/build. On failure, reopen the offending tasks (uncheck, mark failed) → they re-enter `eligible` → run another wave.

**11. Close.** Mark all `tasks.md` checkboxes, run `openspec status --change "<name>" --json`, report progress (N/M tasks). The wave state in `.opencode/.ob-run.json` and agentmemory MCP persists for resume.

> **Resume:** re-loading this skill after any crash recomputes DONE / FAILED / eligible from `tasks.md` + git + agentmemory MCP + `.ob-run.json` and continues. State is on disk, not in this conversation.

---

## Simple mode: sequential in-session

When the plan lives in the Todo pane (from `/plan-quick`) and no OpenSpec change exists:

1. Read the task list from the Todo pane (the `pending` items created by `/plan-quick`).
2. **Create a feature branch** if not already on one: `git switch -c feature/{slug}`. (Skip when the caller passed `start_from: load-plan`.)
3. Work through tasks **one at a time, in order**, directly in this session:
   - Read the task text from the Todo item.
   - Mark it `in_progress` via `todowrite`.
   - Implement it (edit files, run commands as needed).
   - Mark it `completed` via `todowrite`.
   - Commit the change: `git add -A && git commit -m "task {id}: {summary}"`.
4. After all tasks are done, run the project's typecheck/build check if one exists. Fix any errors.
5. Report: tasks N/N completed, commits made, branch name.

**Rules for simple mode:**
- No subagent spawning: work in this session only.
- No OpenSpec commands.
- Keep each commit focused on one task.
- Use `todowrite` to track progress: `pending` → `in_progress` → `completed`.
- If a task is too complex or blocked, mark it `completed` with a note, and continue with the next.

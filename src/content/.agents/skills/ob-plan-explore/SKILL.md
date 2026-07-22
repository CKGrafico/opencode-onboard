---
name: ob-plan-explore
description: Read-only exploration of an idea, problem, or requirement before creating a change. Clarifies what is being asked for (scope, acceptance criteria, edge cases, alternatives), using the codebase as grounding evidence, and recommends an approach. Load when exploring or clarifying a task before planning. Invoked by the /plan-explore command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Explore

This skill is read-only. You may read files, search code, and discuss. The only exception is agentmemory `memory_save` in Step 2, under the conditions defined there. Everything else is in-memory discussion only. Load `ob-plan-apply`, `ob-plan-propose`, or any other skill that writes files only after exploration is complete.

## Input

The caller provides:
- The idea, problem, or requirement to explore (free text, work item content, or a resolved issue).
- Optionally a mode (see below). Default: `interactive`.

## Modes

- `interactive` (default): every checkpoint below is active. Wait for the user at each one.
- `autonomous`: there is no user. Never ask anything. Each checkpoint marked with a stop sign states its autonomous resolution inline. The output is a findings summary returned to the caller.

## Step 0.a: Check for unarchived changes (stop)

Before exploring a new idea, inspect `openspec/changes/` (ignore `openspec/changes/archive`).
If any change folder exists in `openspec/changes/` (names vary by platform: `gh-*`, `us-*`, or a plain slug), list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the exploration or stop to archive the change first? [continue/stop]
```

Wait for the user to respond:
- If the user answers `stop`, end without exploring.
- If the user answers `continue`, proceed to the next step.

Autonomous mode: do not ask; treat the answer as `continue` and proceed.

## Step 0.b: Load exploration skill

Load `@openspec-explore` skill and follow its instructions.

## Step 1: Discuss and analyze

Work through the exploration with the user. Discuss findings, tradeoffs, constraints, and recommended next steps. This is a thinking conversation: no files are created.

Autonomous mode: there is no user to discuss with. Investigate solo, and keep the requirement as the subject: clarify what is being asked for, its scope, acceptance criteria, edge cases, alternatives, and risks. Read code (use CodeGraph MCP tools if available, otherwise grep/read) only to ground those answers in what already exists. Do not turn the exploration into a code audit. Settle on a recommended approach and produce a structured findings summary for the caller: clarified requirement, scope decisions, acceptance criteria, recommended approach.

## Step 2: Offer to save (only if useful) (stop)

After the exploration is complete, if the findings are significant and worth preserving, ask the user:

```text
Save this exploration to agentmemory for future reference? [yes/no]
```

- `yes` -> `memory_save` with title `exploration-{topic}` summarizing the key findings, constraints, and recommended next steps.
- `no` -> proceed to Step 3.

Write a memory note only when the user explicitly asks.

Autonomous mode: do not ask; save the note only if the findings are significant, otherwise skip.

## Step 3: Ask what's next (stop)

Ask the user:

```text
What next? Options:
  /plan-propose: turn this into a full OpenSpec proposal with design, specs, and tasks
  /plan-quick  : lightweight task checklist (skip design/specs)
  /plan-apply  : dive straight into implementation (if the path is clear)
  (or just tell me to keep exploring)
```

Do not create any files. Do not load any of those flows automatically. The only output is the discussion and the optional agentmemory note.

Autonomous mode: skip this step entirely. The EXPLORE stage is complete. Hand the findings summary back to the caller (the `/plan-goal` pipeline) so it immediately continues to the propose phase. This is a stage boundary, not the end of the run.

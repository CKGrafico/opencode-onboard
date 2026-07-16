---
name: ob-plan-explore
description: Read-only exploration of an idea, problem, or requirement before creating a change. Investigates the codebase, weighs tradeoffs, and recommends next steps. Load when exploring or clarifying a task before planning. Invoked by the /plan-explore command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Explore

> **HARD RULE: this skill is read-only. Do NOT write, create, or modify any files.**
>
> You may read files, search code, and discuss. You must NOT:
> - Create or edit any source files, config files, or documentation.
> - Create or modify any OpenSpec artifacts (`openspec/changes/`, specs, tasks.md, proposal.md).
> - Run `git commit`, `git add`, or any file-writing shell command.
> - Load `ob-plan-apply`, `ob-plan-propose`, or any other skill that writes files.
>
> The ONLY exception is agentmemory `memory_save` in Step 2, under the conditions defined there. Everything else is in-memory discussion only.

## Input

The caller provides:
- The idea, problem, or requirement to explore (free text, work item content, or a resolved issue).
- Optionally a **mode** (see below). Default: `interactive`.

## Modes

- **interactive** (default): every checkpoint below is active. Wait for the user at each one.
- **autonomous**: there is no user. Never ask anything. Each checkpoint marked ⛔ states its autonomous resolution inline. The output is a findings summary returned to the caller.

---

**Step 0.a - Check for unarchived changes** ⛔

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

**Autonomous mode:** do not ask; treat the answer as `continue` and proceed.

**Step 0.b - Load exploration skill**

Load `@openspec-explore` skill and follow its instructions.

**Step 1 - Discuss and analyze**

Work through the exploration with the user. Discuss findings, tradeoffs, constraints, and recommended next steps. This is a thinking conversation: no files are created.

**Autonomous mode:** there is no user to discuss with. Investigate solo: read code, trace call paths (use CodeGraph MCP tools if available, otherwise grep/read), weigh alternatives and risks, and settle on a recommended approach. Produce a structured findings summary for the caller.

**Step 2 - Offer to save (only if useful)** ⛔

After the exploration is complete, if the findings are significant and worth preserving, ask the user:

```text
Save this exploration to agentmemory for future reference? [yes/no]
```

- `yes` → `memory_save` with title `exploration-{topic}` summarizing the key findings, constraints, and recommended next steps.
- `no` → proceed to Step 3.

Do NOT write any memory note without this explicit ask.

**Autonomous mode:** do not ask; save the note only if the findings are significant, otherwise skip.

**Step 3 - Ask what's next** ⛔

Ask the user:

```text
What next? Options:
  /plan-propose: turn this into a full OpenSpec proposal with design, specs, and tasks
  /plan-quick  : lightweight task checklist (skip design/specs)
  /plan-apply  : dive straight into implementation (if the path is clear)
  (or just tell me to keep exploring)
```

Do NOT create any files. Do NOT load any of those flows automatically. The ONLY output is the discussion and the optional agentmemory note.

**Autonomous mode:** skip this step entirely. Return the findings summary to the caller; the caller decides what happens next.

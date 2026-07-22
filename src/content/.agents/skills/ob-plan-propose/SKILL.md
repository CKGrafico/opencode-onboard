---
name: ob-plan-propose
description: Parse a work item or idea and produce an OpenSpec change plan (proposal.md, specs, tasks.md) with enriched task assignments (agent, tier, depends_on, touches). Load when turning a requirement into a structured plan. Invoked by the /plan-propose command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Propose

This skill generates the full proposal (proposal.md, specs, tasks.md) in memory first, before the confirmation checkpoint in Step 3 resolves. Write files to disk only after Step 3 resolves to `yes`. The only exception is agentmemory `memory_save` for context-sharing notes (`proposal-{slug}`, `change-{slug}-context`) in Step 4, and only after the proposal is confirmed. These are non-destructive metadata notes.

## Input

The caller provides:
- A work item URL, issue key, or direct feature description. Exploration findings may accompany it; incorporate them.
- Optionally a mode (see below). Default: `interactive`.

## Modes

- `interactive` (default): every checkpoint below is active. Wait for the user at each one.
- `autonomous`: there is no user. Never ask anything. Each checkpoint marked with a stop sign states its autonomous resolution inline.

## Step 0.a: Check for unarchived changes (stop)

Before proposing a new change, inspect `openspec/changes/` (ignore `openspec/changes/archive`).
If any change folder exists in `openspec/changes/` (names vary by platform: `gh-*`, `us-*`, or a plain slug), list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the proposal or stop to archive the change first? [continue/stop]
```

Wait for the user to respond:
- If the user answers `stop`, end without generating a proposal.
- If the user answers `continue`, proceed to the next step.

Autonomous mode: do not ask; treat the answer as `continue` and proceed.

## Step 0.b: Load proposal skill

If a work item URL or issue key is provided (GitHub Issue, Azure DevOps work item, Jira issue, or browser-based backlog): load `@ob-userstory` skill and fetch the work item before continuing. Backlog platform is set in `.opencode/opencode-onboard.json` -> `platform.backlog`. If backlog platform is `none`, skip this step and work from direct input.

## Step 1: Generate the proposal in memory

Load `@openspec-propose` skill and follow its instructions to generate proposal.md, specs, and tasks.md. Do not write them to disk yet. Build the complete proposal content in your context.

## Step 2: Enrich task assignments

1. List every `*-engineer.md` file in `.opencode/agents/`. For each file read:
   - `description:` from the YAML frontmatter: the engineer's specialization summary
   - `## Abilities` section: the skills listed under Development, Testing, Infrastructure (e.g. `@nodejs-backend`, `@secure-nextjs-api-routes`)
   Build a map of `agent-name -> { description, abilities }`.
2. For each task, compare the task text and domain against every engineer's description AND abilities. Pick the engineer whose combined profile most closely matches. `fullstack-engineer` is `mode: primary` (the user's planning agent), not a spawned worker. If no specialist matches a task, flag it in the plan: tell the user "No matching specialist for task N.M. Create one with `/make-engineer`" and leave the agent field blank (or use `basic-engineer` if it exists in `.opencode/agents/`).
3. Pick a tier, derive `depends_on`, derive `touches`, and annotate each task line. Follow the [task annotation](task-annotation.md) reference for the full tier selection guide, dependency derivation, touches derivation, and annotation format with examples.

## Step 3: Show the plan and ask for confirmation (stop)

Display the complete proposal to the user:
- Change name and description
- Total task count
- Full task list with agent (including tier suffix) and dependency annotations

Then ask:

```text
Save this proposal? [yes/edit/stop]
```

- `yes` -> proceed to Step 4 and write all files
- `edit` -> user provides feedback, revise in memory, show again, ask again
- `stop` -> end without writing anything

Wait for the user's response. Do not proceed without a response.

Autonomous mode: do not ask; treat the answer as `yes` and write the files immediately.

## Step 4: Write (only after the Step 3 checkpoint resolves)

Write the proposal files to `openspec/changes/{change-slug}/`:
- `proposal.md`: the change description and rationale
- `specs/`: any spec files generated
- `tasks.md`: the enriched task list with agent annotations
- `memory_save` with title `proposal-{change-slug}` containing the change id, task count, and agent+tier assignments. This lets `ob-plan-apply` verify the plan on resume.
- `memory_save` with title `change-{slug}-context` containing the proposal context so `ob-plan-apply` can pick it up for subagent spawns.

## Step 5: Stop (stop)

Ask the user: "Ready to implement? Run `/plan-apply` to start." Loading `ob-plan-apply` requires explicit user confirmation.

Autonomous mode: skip the ask entirely. The PROPOSE stage is complete. Hand the change slug and task count back to the caller (the `/plan-goal` pipeline) so it immediately continues to the apply phase. This is a stage boundary, not the end of the run.

---
name: ob-plan-propose
description: Parse a work item or idea and produce an OpenSpec change plan (proposal.md, specs, tasks.md) with enriched task assignments (agent, tier, depends_on, touches). Load when turning a requirement into a structured plan. Invoked by the /plan-propose command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Propose

> **HARD RULE: do NOT write any files before the confirmation checkpoint resolves.**
>
> This skill generates the full proposal (proposal.md, specs, tasks.md) in memory first. You must NOT:
> - Create or edit any source files, config files, or documentation.
> - Create or modify OpenSpec artifacts on disk until Step 4 (after the Step 3 checkpoint resolves to `yes`).
> - Run `git commit`, `git add`, or any file-writing shell command.
> - Load `ob-plan-apply` or any other skill that writes source files.
>
> The ONLY exception is agentmemory `memory_save` for context-sharing notes (`proposal-{slug}`, `change-{slug}-context`) in Step 4, and ONLY after the proposal is confirmed. These are non-destructive metadata notes, not source code or project files.

## Input

The caller provides:
- A work item URL, issue key, or direct feature description. Exploration findings may accompany it; incorporate them.
- Optionally a **mode** (see below). Default: `interactive`.

## Modes

- **interactive** (default): every checkpoint below is active. Wait for the user at each one.
- **autonomous**: there is no user. Never ask anything. Each checkpoint marked ⛔ states its autonomous resolution inline.

---

**Step 0.a - Check for unarchived changes** ⛔

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

**Autonomous mode:** do not ask; treat the answer as `continue` and proceed.

**Step 0.b - Load proposal skill**

**If a work item URL or issue key is provided** (GitHub Issue, Azure DevOps work item, Jira issue, or browser-based backlog): load `@ob-userstory` skill and fetch the work item before continuing. Backlog platform is set in `.opencode/opencode-onboard.json` → `platform.backlog`. If backlog platform is `none`, skip this step and work from direct input.

**Step 1 - Generate the proposal in memory**

Load `@openspec-propose` skill and follow its instructions to **generate** proposal.md, specs, and tasks.md: but **do not write them to disk yet**. Build the complete proposal content in your context.

**Step 2 - Enrich task assignments**

1. List every `*-engineer.md` file in `.opencode/agents/`. For each file read:
   - `description:` from the YAML frontmatter: the engineer's specialization summary
   - `## Abilities` section: the skills listed under Development, Testing, Infrastructure (e.g. `@nodejs-backend`, `@secure-nextjs-api-routes`)
   Build a map of `agent-name → { description, abilities }`.
2. For each task, compare the task text and domain against every engineer's description AND abilities. Pick the engineer whose combined profile most closely matches. **NEVER assign `fullstack-engineer` to a task** — it is `mode: primary` (the user's planning agent), not a spawned worker. If no specialist matches a task, flag it in the plan: tell the user "No matching specialist for task N.M — create one with `/make-engineer`" and leave the agent field blank (or use `basic-engineer` if it exists in `.opencode/agents/`).
3. Pick a **tier** for each task based on complexity:
   - `build`: complex code: data models, APIs, auth logic, core business logic, UI components
   - `fast`: light work: i18n keys, config changes, env variables, navigation links, simple markup, verification runs
   - `plan`: reserved for orchestration, do not use for implementation tasks
   The tier suffix is appended to the agent name with a dot (e.g. `backend-engineer.build`). This is the agent name you write in the annotation: the `ob-subagent-tiers` plugin resolves the model at startup from `models[<tier>]`.
4. Derive **`depends_on`** for each task: the OpenSpec task IDs (`N.M`) it logically needs completed first (a task that consumes another's output: UI needs its RPC, tests need the code, a seed needs its migration). Root tasks get `[]`. Reference the IDs OpenSpec already generated; never invent new ones.
5. Derive **`touches`** for each task: the file path(s)/glob(s) it will create or modify (the task text usually names them, e.g. "Modify src/board/components/CreateForm.tsx"). This lets `ob-plan-apply` serialize same-file tasks that have no logical dependency. Include net-new files.
6. Annotate each task line in-place with all three fields:

```
- [ ] <task text> <!-- agent: <name>, depends_on: [<ids>], touches: [<globs>] -->
```

Example result (note same-file tasks like 1.1/1.2 share `touches`, so `ob-plan-apply` runs them sequentially even with no `depends_on` between them; tier suffix encodes the model):

```
- [ ] 1.1 Add Project model to schema <!-- agent: backend-engineer.build, depends_on: [], touches: [src/types.ts] -->
- [ ] 1.2 Add projectId field to LoopOptions <!-- agent: backend-engineer.build, depends_on: [], touches: [src/types.ts] -->
- [ ] 2.1 Project RPC endpoints <!-- agent: backend-engineer.build, depends_on: [1.1], touches: [src/rpc/project/**] -->
- [ ] 3.1 Accept page UI <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/board/components/CreateForm.tsx] -->
- [ ] 3.2 i18n keys for invitation flow <!-- agent: frontend-engineer.fast, depends_on: [3.1], touches: [src/i18n/**] -->
- [ ] 4.1 Run typecheck and fix errors <!-- agent: backend-engineer.fast, depends_on: [2.1,3.1], touches: [] -->
```

`ob-plan-apply` reads these annotations to build conflict-free waves: `depends_on` gates ordering, `touches` keeps concurrent agents file-disjoint, and the tier suffix in `agent` determines the model (resolved at startup by the `ob-subagent-tiers` plugin). **`depends_on` is mandatory; `touches` is a best-effort hint** that codegraph MCP tools refine at apply time.

**Step 3 - Show the plan and ask for confirmation** ⛔

Display the complete proposal to the user:
- Change name and description
- Total task count
- Full task list with agent (including tier suffix) and dependency annotations

Then ask:

```text
Save this proposal? [yes/edit/stop]
```

- `yes` → proceed to Step 4 and write all files
- `edit` → user provides feedback, revise in memory, show again, ask again
- `stop` → end without writing anything

Wait for the user's response. Do NOT proceed without a response.

**Autonomous mode:** do not ask; treat the answer as `yes` and write the files immediately.

**Step 4 - Write (only after the Step 3 checkpoint resolves)**

Write the proposal files to `openspec/changes/{change-slug}/`:
- `proposal.md`: the change description and rationale
- `specs/`: any spec files generated
- `tasks.md`: the enriched task list with agent annotations
- `memory_save` with title `proposal-{change-slug}` containing the change id, task count, and agent+tier assignments. This lets `ob-plan-apply` verify the plan on resume.
- `memory_save` with title `change-{slug}-context` containing the proposal context so `ob-plan-apply` can pick it up for subagent spawns.

**Step 5 - Stop** ⛔

**Stop.** Ask the user: "Ready to implement? Run `/plan-apply` to start." Do NOT start implementing automatically.

**Autonomous mode:** skip the ask entirely. The PROPOSE stage is complete — hand the change slug and task count back to the caller (the `/plan-goal` pipeline) so it immediately continues to the apply phase. Do NOT stop or end the turn here; this is a stage boundary, not the end of the run.

# AGENTS.md, Bootstrap Mode

> This project has not been initialized yet.
> Your ONLY job right now is to run the initialization sequence below.
> Do not do anything else until all steps are complete.

## Trigger

When the user says anything resembling initialization, "init", "initialize", "setup", "start", "bootstrap", "get started", "prepare", execute all steps below in order. Do not ask for confirmation before starting.

---

## Initialization Sequence

### Step 1, Archive project history into OpenSpec

Scan the codebase for any existing documentation, changelogs, ADRs, README files, or notable history that describes decisions already made in this project. Create an OpenSpec archive entry that captures this history so agents have context going forward.

```bash
openspec new change "project-history"
```

Write a `proposal.md` inside that change summarizing:
- What this project is
- Key decisions already made (inferred from code and docs)
- Known tech debt or constraints visible in the codebase
- Current state of the project

Then archive it immediately:
```bash
openspec archive "project-history"
```

---

### Step 2, Generate DESIGN.md

`DESIGN.md` contains a prompt. You MUST follow this exact sequence, do not skip or reorder steps:

1. **Read `DESIGN.md` now** using a file read tool. The file contains a prompt with instructions and an output format.
2. **Store the full prompt text** in your context.
3. **Overwrite `DESIGN.md` with an empty string** (zero bytes). Do this before generating any content.
4. **Analyze the actual codebase**: read CSS files, Tailwind config, component files, token definitions. Do not rely on prior knowledge, read the files.
5. **Write the result into `DESIGN.md`** following exactly the format and sections described in the stored prompt.

The output must be a real, populated `DESIGN.md` based on what you found in the codebase, not from memory or assumptions.

---

### Step 3, Generate ARCHITECTURE.md

`ARCHITECTURE.md` contains a prompt. You MUST follow this exact sequence, do not skip or reorder steps:

1. **Read `ARCHITECTURE.md` now** using a file read tool. The file contains a prompt with instructions and an output format.
2. **Store the full prompt text** in your context.
3. **Overwrite `ARCHITECTURE.md` with an empty string** (zero bytes). Do this before generating any content.
4. **Analyze the actual codebase**: read folder structure, config files, route definitions, data models, integration points. Do not rely on prior knowledge, read the files.
5. **Write the result into `ARCHITECTURE.md`** following exactly the format and sections described in the stored prompt.

The output must be a real, populated `ARCHITECTURE.md` based on what you found in the codebase, covering all sections the prompt describes.

---

### Step 4, Rewrite this file

Replace the entire contents of this file (`AGENTS.md`) with everything below the line `<!-- AGENTS-TEMPLATE-START -->` in this same file. Delete the bootstrap section and the template marker, the file should contain only the template content when done.

---

### Step 4b, Patch opsx-apply for ensemble

Read **both** `.opencode/commands/opsx-apply.md` AND `.opencode/skills/openspec-apply-change/SKILL.md`. They contain the same solo implementation loop. Patch both identically.

In each file, find the step that instructs the agent to **implement tasks directly**, it will contain phrases like "make the code changes", "implement tasks", "loop until done or blocked". This step tells the agent to write code itself.

**Replace that step and everything after it** (completion output, pause output, guardrails, fluid workflow) with the following:

```markdown
6. **Implement via ensemble team**

   NEVER implement tasks directly. Always delegate to specialists via ensemble.

   a. Create feature branch if not already on one: `feature/{id}-{slug}`
   b. Create team:
      ```
      team_create "<change-name>"
      ```
      Announce: "Team running. Monitor at http://localhost:4747/"

   c. Spawn only what the tasks require (in parallel):
      ```
      team_spawn name:front   agent:front-engineer  → UI/frontend tasks
      team_spawn name:back    agent:back-engineer   → backend/API tasks
      team_spawn name:infra   agent:infra-engineer  → infra/pipeline tasks
      ```
      Pass each specialist: their relevant tasks + all context file paths from step above.
      Log each spawn to `.agents/session-log.md` (see Session Log section).

   d. Wait for all → `team_results` → `team_shutdown` + `team_merge`

7. **Quality check**

   ```
   team_spawn name:quality agent:quality-engineer
   ```
   Wait → `team_results` → fix blockers → `team_shutdown`

8. **Mark tasks complete in openspec**

   After specialists finish, update the tasks file: `- [ ]` → `- [x]` for each completed task.
   Run `openspec status --change "<name>" --json` to confirm progress.

9. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive with `/opsx-archive`
   - If paused: explain why and wait for guidance

   Then run `team_cleanup`.

**Guardrails**
- NEVER implement tasks directly, always use `team_create` + `team_spawn`, no exceptions
- "Small feature", "faster to do it directly", "environment issues" are NOT valid reasons to skip ensemble, if you find yourself thinking this, stop and spawn anyway
- Always read context files before spawning (from the apply instructions output)
- Always pass context file paths and task list to spawned specialists
- Mark tasks complete in openspec AFTER specialists finish, not before
- If task is ambiguous, pause and ask before spawning
- If implementation reveals issues, pause and suggest artifact updates
- Pause on errors, blockers, or unclear requirements, don't guess
- Use contextFiles from CLI output, don't assume specific file names
```

Keep all steps before the implementation step unchanged in both files, they are openspec's domain (select change, check status, get instructions, read context, show progress).

---

### Step 5, Confirm

Tell the user:

```
Initialization complete.

- ARCHITECTURE.md generated
- DESIGN.md generated
- Project history archived in openspec
- AGENTS.md updated with real guidance

You're ready to work.
```

---

## Guardrails During Init

- Do NOT implement any features
- Do NOT create branches or PRs
- Do NOT modify any project source files
- Do NOT create RTK files, scripts, or wrappers, RTK is already defined in AGENTS.md and agent files
- Only read source files for analysis, write only to ARCHITECTURE.md, DESIGN.md, AGENTS.md, and openspec/

<!-- AGENTS-TEMPLATE-START -->
# AGENTS.md

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic, works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Project Overview

This is the agent orchestration layer for your project. It provides:
- Universal agent team for development workflow
- OpenSpec change management
- Skills for platform-specific knowledge

## I Am the Lead, Full Workflow Ownership

When the user provides a work item URL, says "implement the plan", or "I've added comments to the PR", **I own the full lifecycle**. I load the appropriate skill and use ensemble tools (`team_create`, `team_spawn`, etc.) to coordinate the agent team.

Trigger patterns:
- `work on this <azure-devops-url>` → spawn `devops-manager` in read mode → propose OpenSpec → **confirm with user** → implement → ship
- `work on this <github-url>` → spawn `devops-manager` in read mode → propose OpenSpec → **confirm with user** → implement → ship
- `implement the plan` → run `/opsx-apply` (ensemble orchestration is built into the command) → ship
- `I've added comments to the PR` → spawn `devops-manager` in feedback mode → fix → update PR

**Never delegate without a plan. Never write implementation code directly, always spawn specialists, no exceptions. "Small feature", "faster to do it directly", or "environment issues" are not valid reasons to skip ensemble.**

## Multi-Agent Execution, opencode-ensemble

Parallel execution uses the `opencode-ensemble` plugin (`team_create`, `team_spawn`, etc.).
Works on **all platforms** (Windows, macOS, Linux) via OpenCode's built-in worktree support.

| Tool | What it does |
|------|-------------|
| `team_create` | Create a team (caller becomes lead) |
| `team_spawn` | Start a teammate asynchronously |
| `team_shutdown` | Stop a teammate, preserve their branch |
| `team_merge` | Merge a teammate's branch into working dir |
| `team_cleanup` | Tear down the team |
| `team_results` | Retrieve full message from a teammate |
| `team_message` | Send a direct message to a teammate |
| `team_broadcast` | Message all teammates |
| `team_tasks_add` | Add tasks to shared board |
| `team_tasks_complete` | Mark task done |

**Dashboard**: Monitor running agents at **http://localhost:4747/**

---

## Pipeline

```
devops-manager (read mode)
  → parse work item via skill → structured summary
        ↓
  openspec-propose
  → proposal.md + specs + tasks
        ↓
  [confirm with user]
        ↓
front-engineer + back-engineer + infra-engineer  ← parallel, only spawn what the task needs
        ↓
quality-engineer
  → tests, build, lint, acceptance criteria
        ↓
security-auditor
  → vulnerability audit, secrets, auth gaps
        ↓
devops-manager (ship mode)
  → screenshots → commit → push → PR → post comment
```

### Phase 1, Parse & Propose

```
1. team_spawn devops-manager (read mode) → fetch work item via skill, output summary
2. Load skill: openspec-propose → generate proposal.md, specs/, tasks.md
   - team_create → spawn design + specs in parallel → merge → write tasks.md
3. Show the plan: change name, schema, total tasks, task list summary
4. STOP. Ask user: "Ready to implement? (yes/no)", DO NOT proceed until confirmed.
```

### Phase 2, Implement

```
1. Run /opsx-apply (or load skill openspec-apply-change)
   The command handles context reading, ensemble orchestration, and task marking automatically.
   DO NOT implement tasks directly, the command spawns specialists via ensemble.
2. After /opsx-apply completes, proceed to quality check.
```

### Phase 3, Quality

```
7. team_spawn name:quality agent:quality-engineer → tests, build, lint
8. Wait → team_results → fix any blockers → team_shutdown
```

### Phase 4, Security

```
9. team_spawn name:security agent:security-auditor → audit full change
10. Wait → team_results → fix Critical findings → team_shutdown
```

### Phase 5, Ship

```
11. team_spawn name:devops agent:devops-manager (ship mode)
    → screenshots → commit & push → create PR → post comment
12. Wait → team_results → report PR URL to user
13. team_cleanup
```

### Phase 6, PR Feedback Loop

```
When user says "I've added comments to the PR":
1. team_spawn devops-manager (feedback mode) → read & classify comments
2. Wait → team_results → spawn front/back/infra for code-change items (parallel)
3. Wait → team_results → spawn quality-engineer → verify fixes
4. Wait → team_results → spawn devops-manager (ship mode) → push & update PR
5. team_cleanup
```

---

## Agents

All agents are universal, no project-specific knowledge. Platform and tech knowledge comes from skills.

| Agent | File | Role |
|-------|------|------|
| `devops-manager` | .agents/agents/devops-manager.md | Reads work items, creates PRs, handles review feedback |
| `front-engineer` | .agents/agents/front-engineer.md | Web, mobile, UI implementation |
| `back-engineer` | .agents/agents/back-engineer.md | APIs, services, data, AI implementation |
| `infra-engineer` | .agents/agents/infra-engineer.md | Terraform, pipelines, cloud infrastructure |
| `quality-engineer` | .agents/agents/quality-engineer.md | Unit, integration, e2e tests across all layers |
| `security-auditor` | .agents/agents/security-auditor.md | Vulnerability audit, secrets, auth gaps |

## Skills

Skills provide platform and tech-specific knowledge. Agents detect and load them automatically, the user never specifies which skill to use.

Skills are located in `.agents/skills/`. Each skill has a `SKILL.md` with a description the agent reads to determine relevance.

| Skill | Purpose |
|-------|---------|
| `ob-userstory-az` | Parse Azure DevOps work item URL |
| `ob-userstory-gh` | Parse GitHub Issue URL |
| `ob-pullrequest-az` | Create PR on Azure DevOps |
| `ob-pullrequest-gh` | Create PR on GitHub |
| `openspec-propose` | Propose change artifacts (proposal, specs, tasks) |
| `openspec-apply-change` | Implement change with agent team |
| `openspec-archive-change` | Archive completed change |
| `browser-automation` | Browser automation for localhost UI, screenshots, clicks, queries |

---

## Branch Naming

Format: `feature/{issue-id}-{slug}`
Example: `feature/42-add-user-auth`

---

## Project Structure

```
[project-root]/
├── .agents/
│   ├── agents/        # Agent definitions (universal, no project knowledge)
│   └── skills/        # Skills (platform/tech specific knowledge)
├── openspec/
│   ├── specs/
│   └── changes/
│       └── {change}/
│           └── images/
├── AGENTS.md
├── ARCHITECTURE.md
└── DESIGN.md
```

---

## Session Log

<!-- session-logging: enabled -->

All agents MUST log their activity to `.agents/session-log.md`.

**Check before logging:** Read the `session-logging` comment above. If it says `disabled`, skip all logging.

**Every agent MUST create or append to this file when it starts, no exceptions.** If the file does not exist, create it with this exact header first:

```markdown
# Session Log

| Timestamp | Agent | Action | Detail |
|-----------|-------|--------|--------|
```

Then immediately append a `started` row.

**Log these events** by appending a row:
- Lead spawns an agent → `| {ISO timestamp} | lead | spawned | {agent-name}, {purpose} |`
- Agent starts → `| {ISO timestamp} | {agent-name} | started | {task summary} |`
- Agent loads a skill → `| {ISO timestamp} | {agent-name} | skill-loaded | {skill-name} |`
- Agent completes → `| {ISO timestamp} | {agent-name} | completed | {files changed count} files, skills: {comma-separated skill names or none} |`
- Agent blocked → `| {ISO timestamp} | {agent-name} | blocked | {reason} |`

**Rules:**
- Creating the file and logging `started` is mandatory, do it before any other work
- Append only, never overwrite previous entries
- One row per event, keep detail column short
- Use ISO 8601 timestamps
- The file is gitignored, never commit it

---

## RTK

Use `rtk` wrapper for ALL CLI commands. Never run git, az, gh, or openspec commands directly.

- `rtk git add` NOT `git add`
- `rtk git commit` NOT `git commit`
- `rtk git push` NOT `git push`
- `rtk az boards work-item show` NOT `az boards work-item show`
- `rtk az repos pr create` NOT `az repos pr create`
- `rtk gh issue view` NOT `gh issue view`
- `rtk gh pr create` NOT `gh pr create`
- `rtk openspec new change` NOT `openspec new change`

---

## Guardrails

### Git Operations

Agents CAN:
- ✅ Commit to feature branches
- ✅ Push to feature branches

Agents CANNOT:
- ❌ Commit or push to `main`, FORBIDDEN
- ❌ Force push, FORBIDDEN
- ❌ Merge PRs, human-only
- ❌ Create or delete branches other than `feature/*`

### Platform CLI

ALL platform interactions via CLI only. Browser MCP FORBIDDEN for any DevOps or GitHub operation.

| Operation | Azure DevOps | GitHub |
|-----------|-------------|--------|
| Read issue | `az boards work-item show --id <id>` | `gh issue view <number>` |
| Read PR threads | `az devops invoke ...` | `gh pr view <number> --comments` |
| Create PR | `az repos pr create ...` | `gh pr create ...` |

Browser MCP tools permitted only for screenshots of **local running app** on `localhost` URLs.

### Security

Agents CANNOT:
- ❌ Access `.env` or config files with secrets
- ❌ Log or output credentials, API keys, or tokens
- ❌ Commit secrets to git

### Scope

- Max 10 files per change
- No architecture changes without human approval
- No pipeline modifications without human approval

---

## Communication Style

Terse. Technical substance exact. Only fluff die.
Drop: articles, filler, pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].

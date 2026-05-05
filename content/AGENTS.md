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

Before scanning, load source roots from `.agents/source-roots.json` when present. Only scan those roots plus this repo's docs/config files.

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
4. **Analyze the actual codebase**: use `.agents/source-roots.json` as source roots when present, then read CSS files, Tailwind config, component files, token definitions. Do not rely on prior knowledge, read the files.
5. **Write the result into `DESIGN.md`** following exactly the format and sections described in the stored prompt.

The output must be a real, populated `DESIGN.md` based on what you found in the codebase, not from memory or assumptions.

---

### Step 3, Generate ARCHITECTURE.md

`ARCHITECTURE.md` contains a prompt. You MUST follow this exact sequence, do not skip or reorder steps:

1. **Read `ARCHITECTURE.md` now** using a file read tool. The file contains a prompt with instructions and an output format.
2. **Store the full prompt text** in your context.
3. **Overwrite `ARCHITECTURE.md` with an empty string** (zero bytes). Do this before generating any content.
4. **Analyze the actual codebase**: use `.agents/source-roots.json` as source roots when present, then read folder structure, config files, route definitions, data models, integration points. Do not rely on prior knowledge, read the files.
5. **Write the result into `ARCHITECTURE.md`** following exactly the format and sections described in the stored prompt.

The output must be a real, populated `ARCHITECTURE.md` based on what you found in the codebase, covering all sections the prompt describes.

---

### Step 4, Rewrite this file

Replace the entire contents of this file (`AGENTS.md`) with everything below the line `<!-- AGENTS-TEMPLATE-START -->` in this same file. Delete the bootstrap section and the template marker, the file should contain only the template content when done.

---

### Step 5, Confirm

Tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ARCHITECTURE.md generated
- DESIGN.md generated
- Project history archived in openspec
- AGENTS.md updated with real guidance

!! RESTART OPENCODE NOW !!

Quit and reopen OpenCode before doing anything else.
Nothing will work correctly until you do.
After restarting you are ready to work.
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

## Source Scope

- Read source scope from `.agents/source-roots.json`.
- Use those roots for codebase analysis tasks (design, architecture, project-history, exploration).
- If missing, default to current folder.

## I Am the Lead, Full Workflow Ownership

When the user provides a work item URL or says "implement the plan" or "I've added comments to the PR", **I own the full lifecycle**. I load the appropriate skill and use ensemble tools to coordinate the agent team.

Trigger patterns, I recognize ALL of these, exact wording does not matter:
- User pastes or mentions a GitHub Issue URL → load `ob-userstory-gh` skill → parse issue → run `/opsx-propose` → confirm with user → run `/opsx-apply` → ship
- User pastes or mentions an Azure DevOps URL → load `ob-userstory-az` skill → parse work item → run `/opsx-propose` → confirm with user → run `/opsx-apply` → ship
- `implement the plan` / `implement` / `start` / `go` → run `/opsx-apply` → ship
- `I've added comments to the PR` → read PR comments → fix → update PR
- Any GitHub/Azure DevOps PR URL in a feedback/fix request (e.g. "check comments", "fix PR feedback") → run PR Feedback Loop

**A GitHub or Azure DevOps URL anywhere in the user's message is always a trigger, regardless of surrounding words.**

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
| `team_results` | Retrieve full message content (delivery is a ping only) |
| `team_message` | Send a direct message to a teammate or lead |
| `team_broadcast` | Message all teammates |
| `team_status` | View all members and task summary |
| `team_tasks_list` | View the shared task board |
| `team_tasks_add` | Add tasks to shared board |
| `team_tasks_complete` | Mark task done, auto-unblocks dependents |
| `team_claim` | Atomically claim a pending task (teammates use this) |

**Dashboard**: Monitor running agents at **http://localhost:4747/**

**Progress inspection commands (tell user explicitly after spawning):**
- `team_status` for live team snapshot
- `team_tasks_list` for task board state
- `team_view member:"<name>"` to inspect a teammate live session
- `team_results from:"<name>"` to fetch full teammate report text

If a teammate stalls due to model quota/rate-limit exhaustion:
1. `team_shutdown name:"<stuck-member>" force:true`
2. `team_spawn` same member/task with an available model
3. `team_message` start instruction with the exact next task ID

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
back-engineer → front-engineer → infra-engineer  ← sequential, one at a time, only spawn what the task needs
        ↓
quality-engineer (worktree:false)
  → tests, build, lint, acceptance criteria
        ↓
security-auditor (worktree:false)
  → vulnerability audit, secrets, auth gaps
        ↓
devops-manager (ship mode)
  → screenshots → commit → push → PR → post comment
```

### Phase 1, Parse & Propose

```
1. Detect URL type → load matching skill (ob-userstory-gh or ob-userstory-az)
2. Follow skill steps: fetch issue/work item via CLI, create OpenSpec change
3. Run /opsx-propose → generates proposal.md, specs/, design.md, tasks.md
4. Show the plan: change name, total tasks, task list summary
5. STOP. Ask user: "Ready to implement? (yes/no)", DO NOT proceed until confirmed.
```

### Phase 2, Implement

```
1. Run /opsx-apply, handles context reading, ensemble orchestration, and task marking.
   - Lead adds all tasks to board, then spawns specialists ONE AT A TIME (not parallel)
   - Each specialist claims tasks, implements, completes tasks, messages lead when done
   - Lead merges each branch after shutdown, then marks tasks done in tasks.md
2. After /opsx-apply completes, proceed to quality check.
```

### Phase 3, Quality

```
3. team_spawn name:quality agent:quality-engineer worktree:false → tests, build, lint
4. Wait → team_results → fix any blockers → team_shutdown (no merge, worktree:false)
```

### Phase 4, Security

```
5. team_spawn name:security agent:security-auditor worktree:false → audit full change
6. Wait → team_results → fix Critical findings → team_shutdown (no merge, worktree:false)
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
When user says "I've added comments to the PR" or asks to fix PR comments from PR URLs:
1. team_create "pr-feedback-<id>-<random>"
2. team_tasks_add with at least these lead-managed tasks:
   - Parse and classify PR feedback (devops-manager)
   - Implement Api feedback items (back-engineer, if needed)
   - Implement App feedback items (front-engineer, if needed)
   - Infra feedback items (infra-engineer, if needed)
   - Verify with tests/build (quality-engineer)
   - Push updates and post PR replies (devops-manager)
3. team_spawn devops-manager (feedback mode) with explicit task IDs, then team_message "Start now"
4. Wait for message → team_results
5. Add/update implementation tasks on board from parsed checklist (Api/App/Infra), then spawn needed specialists in parallel with explicit task IDs + team_message "Start now"
6. Wait for specialist results → team_shutdown + team_merge per specialist
7. team_spawn quality-engineer worktree:false with verification task ID + team_message "Start now"
8. Wait → team_results → fix blockers if any
9. team_spawn devops-manager (ship mode) with "push + update PR threads" task ID + team_message "Start now"
10. Wait → team_results → report what was updated
11. team_cleanup
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

When `## Source Roots` lists multiple roots, each root is an independent git repository. The same branch name must be created in every repo that will have changes. Git operations (`branch`, `commit`, `push`) run once per repository — there is no shared git history.

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

**Multi-repo**: When `## Source Roots` lists multiple roots, each is an independent git repository with its own history. All `rtk git` commands must be issued per repository. Never assume one `git` context covers all repos. Create the feature branch in each repo, commit per repo, push per repo, open one PR per repo.

### Platform CLI

ALL platform interactions via CLI only. Browser MCP and webfetch FORBIDDEN for any DevOps or GitHub operation, use `gh` or `az` CLI exclusively, never fall back to HTTP requests.

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

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
- Do NOT create CLI wrapper files or scripts
- Only read source files for analysis, write only to ARCHITECTURE.md, DESIGN.md, AGENTS.md, and openspec/

<!-- AGENTS-TEMPLATE-START -->
# AGENTS.md

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic, works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Project Overview

This is the agent orchestration layer for your project. It provides:
- Universal agent team for development workflow
- OpenSpec change management
- Mandatory global baseline skill (`ob-global`) for all agents
- Additional skills for platform/task-specific knowledge

## Source Scope

Source scope is defined by mandatory `ob-global` skill.

- Load `ob-global` first.
- Follow the generated `## Source Roots` section from that skill.
- Do not duplicate source-scope rules here.

## I Am the Lead, Full Workflow Ownership

When the user provides a work item URL or says "implement the plan" or "I've added comments to the PR", **I own the full lifecycle**. I load `ob-global` skill first, then the appropriate userstory skill, and use ensemble tools to coordinate the agent team.

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

Core tools used in this workflow:
- `team_create`, `team_spawn`, `team_shutdown`, `team_merge`, `team_cleanup`
- `team_tasks_add`, `team_tasks_list`, `team_claim`, `team_tasks_complete`
- `team_message`, `team_results`, `team_status`

**Dashboard**: Monitor running agents at **http://localhost:4747/**

**Hard limits:**
- **Max 3 concurrent agents.** Spawn in waves if more needed. Wait for wave N to finish before spawning wave N+1.
- **Non-overlapping file domains.** Each agent owns exclusive directories. Two agents must NEVER touch the same file.
- **Immediate shutdown on completion.** The moment an agent reports done → `team_shutdown` → `team_merge`. Never leave idle agents running.
- **Stall detection at 5 minutes.** No commits after 5 min → nudge message → 2 min grace → force shutdown + respawn.

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
devops-manager (lead mode)
  → load ob-global + parse work item via skill
        ↓
  openspec-propose
  → proposal.md + specs + tasks
        ↓
  [confirm with user]
        ↓
basic-engineer + custom-engineer-* (parallel as needed)
  → claim tasks + load abilities + implement
        ↓
devops-manager (ship mode)
  → verify completion → commit → push → PR → post comment
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
1. Run /opsx-apply.
   - Lead adds all tasks to board.
   - Lead spawns one or more engineers (`basic-engineer` and/or custom engineers) in parallel where safe.
   - Each engineer must claim task IDs, load relevant abilities, implement, and complete tasks.
   - Lead merges each engineer branch after shutdown, then marks tasks done in tasks.md.
2. Verify with tests/build/lint according to task scope.
```

### Phase 3, Ship

```
3. team_spawn name:devops agent:devops-manager (ship mode)
   → commit & push → create PR → post comment
4. Wait → team_results → report PR URL to user
5. team_cleanup
```

### Phase 4, PR Feedback Loop

```
When user says "I've added comments to the PR" or asks to fix PR comments from PR URLs:
1. team_create "pr-feedback-<id>-<random>"
2. team_tasks_add with at least these lead-managed tasks:
   - Parse and classify PR feedback (devops-manager)
   - Implement feedback items (basic-engineer and/or custom engineers)
   - Verify with tests/build/lint (implementation worker or dedicated verifier if available)
   - Push updates and post PR replies (devops-manager)
3. team_spawn devops-manager (feedback mode) with explicit task IDs, then team_message "Start now"
4. Wait for message → team_results
5. Add/update implementation tasks on board, then spawn needed engineers in parallel with explicit task IDs + team_message "Start now"
6. Wait for engineer results → team_shutdown + team_merge per engineer
7. Run verification tasks (tests/build/lint) and fix blockers if any
8. team_spawn devops-manager (ship mode) with "push + update PR threads" task ID + team_message "Start now"
9. Wait → team_results → report what was updated
10. team_cleanup
```

---

## Agents

All agents are universal, no project-specific knowledge. Platform and tech knowledge comes from skills.

| Agent | File | Role |
|-------|------|------|
| `devops-manager` | .agents/agents/devops-manager.md | Reads work items, creates PRs, handles review feedback |
| `basic-engineer` | .agents/agents/basic-engineer.md | Generic implementation worker using ability-loaded skills |

User can add more custom engineer agents and run them in parallel. Keep behavior ability-driven via skill mappings.

Default `basic-engineer` abilities:

```
## Abilities
- Guardrails: @ob-generic-guardrails, @ob-default
- Development: @ob-default
- Testing: @ob-default
- Infrastructure: @ob-default
```

## Skills

Skills provide platform and tech-specific knowledge. Agents detect and load them automatically, **you never tell an agent which skill to use**.

`ob-global` is always loaded first, it provides baseline rules for all agents.

Skills are located in `.agents/skills/`. Each skill has a `SKILL.md` with a description the agent reads to determine relevance.

| Skill | Purpose |
|-------|---------|
| `ob-global` | Generic skill, baseline rules loaded by all agents. Context, source roots, git/secrets guardrails, token opt rules |
| `ob-default` | Fallback skill, when no other skill matches |
| `ob-generic-guardrails` | Minimal foundation for user guardrails skills |
| `ob-userstory-az` | Parse Azure DevOps work item URL |
| `ob-userstory-gh` | Parse GitHub Issue URL |
| `ob-pullrequest-az` | Create PR on Azure DevOps |
| `ob-pullrequest-gh` | Create PR on GitHub |
| `openspec-propose` | Propose change artifacts (proposal, specs, tasks) |
| `openspec-apply-change` | Implement change with agent team |
| `openspec-archive-change` | Archive completed change |
| `browser-automation` | Browser automation for localhost UI, screenshots, clicks, queries |

Execution rules live in skills. Keep AGENTS.md focused on orchestration and routing.

---

## Branch Naming

Format: `feature/{issue-id}-{slug}`
Example: `feature/42-add-user-auth`

When `## Source Roots` lists multiple roots, each root is an independent git repository. The same branch name must be created in every repo that will have changes. Git operations (`branch`, `commit`, `push`) run once per repository, there is no shared git history.

---

## Project Structure

```
[project-root]/
├── .agents/
│   ├── agents/        # Agent definitions (universal, no project knowledge)
│   │   ├── devops-manager.md
│   │   ├── basic-engineer.md
│   │   └── custom-engineer-*.md   # optional, user-defined workers
│   └── skills/      # Skills (platform/tech specific knowledge)
│       ├── ob-global/              ← baseline skill, load first
│       ├── ob-default/            ← fallback skill
│       ├── ob-generic-guardrails/ ← foundation for user guardrails
│       ├── ob-userstory-gh/
│       ├── ob-userstory-az/
│       └── browser-automation/
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

## Guardrails

Guardrails are mandatory via `ob-global` and ability-loaded skills.

Minimal non-negotiables:
- Never commit or push to `main`.
- Never force push.
- Never expose or commit secrets.
- Use `gh`/`az` CLI for platform operations.
- In multi-repo source scope, run git operations per repository.

---

## Communication Style

Terse. Technical substance exact. Only fluff die.
Drop: articles, filler, pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].

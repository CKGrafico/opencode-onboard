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
- `work on this <azure-devops-url>` → spawn `devops-manager` in read mode → propose OpenSpec → implement → ship
- `work on this <github-url>` → spawn `devops-manager` in read mode → propose OpenSpec → implement → ship
- `implement the plan` → load skill `openspec-apply-change` → implement → ship
- `I've added comments to the PR` → spawn `devops-manager` in feedback mode → fix → update PR

**Never delegate without a plan. Never write implementation code directly, always spawn specialists.**

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
3. Show summary, confirm with user before implementing
```

### Phase 2, Implement

```
1. Load skill: openspec-apply-change → get apply instructions
2. Create feature branch: feature/{id}-{slug}
3. team_create "<change-name>"
4. Announce: "Team running. Monitor at http://localhost:4747/"
5. Spawn only what the task needs (in parallel):
   team_spawn name:front   agent:front-engineer  → UI tasks
   team_spawn name:back    agent:back-engineer   → backend tasks
   team_spawn name:infra   agent:infra-engineer  → infra tasks
6. Wait for all → team_results → team_shutdown + team_merge
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

---

## Branch Naming

Format: `feature/{issue-id}-{slug}`
Example: `feature/42-add-user-auth`

---

## Project Structure

```
[project-root]/
└── Copilots/              ← THIS FOLDER (agent orchestration)
    ├── .opencode/
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

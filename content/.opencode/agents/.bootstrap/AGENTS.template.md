# AGENTS.md

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic — works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Project Overview

This is the agent orchestration layer for your project. It provides:
- Agent skills for development workflow tasks
- OpenSpec change management
- Memory files for agent context

## I Am the Lead — Full Workflow Ownership

When the user provides an issue/user story URL, says "implement the plan", or "I've added comments to the PR" — **I own the full lifecycle**. I load the appropriate skill and use ensemble tools (`team_create`, `team_spawn`, etc.) to coordinate specialist agents in parallel.

Trigger patterns:
- `work on this <azure-devops-url>` → load skill `ob-userstory-az` → propose OpenSpec → implement → PR
- `work on this <github-url>` → load skill `ob-userstory-gh` → propose OpenSpec → implement → PR
- `implement the plan` → load skill `openspec-apply-change` → implement → PR
- `I've added comments to the PR` → spawn `ob-pullrequest-observer-az` or `ob-pullrequest-observer-gh` → fix → update PR

**Never delegate without a plan. Never write implementation code directly — always spawn specialists.**

## Multi-Agent Execution — opencode-ensemble

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

## Full Workflow

### Phase 1 — Parse & Propose (new issue/US URL)

```
1. Load skill: ob-userstory-az or ob-userstory-gh → fetch work item, create OpenSpec change
2. Load skill: openspec-propose → generate proposal.md, design.md, specs/, tasks.md
   - team_create → team_spawn design (worktree:true) + team_spawn specs (worktree:true) in parallel
   - Wait for both → team_shutdown + team_merge both → write tasks.md
3. Show summary, confirm with user before implementing
```

### Phase 2 — Implement

```
1. Load skill: openspec-apply-change → get apply instructions
2. Create feature branch
3. team_create "<change-name>"
4. Announce: "Team is running. Monitor progress at http://localhost:4747/"
5. Spawn in parallel:
   team_spawn name:backend  agent:backend  → backend tasks
   team_spawn name:frontend agent:frontend → frontend tasks
6. Wait for both → team_results → team_shutdown + team_merge both
```

### Phase 3 — QA

```
7. team_spawn name:qa agent:qa → review against specs, run builds
8. Wait → team_results → fix any blockers
9. team_shutdown qa
```

### Phase 4 — PR Creation

```
10. team_spawn name:ob-pullrequest-creator-az agent:ob-pullrequest-creator-az  (Azure DevOps projects)
    team_spawn name:ob-pullrequest-creator-gh  agent:ob-pullrequest-creator-gh  (GitHub projects)
    → Screenshots → save to openspec/changes/<change>/images/
    → Commit & push to feature branch
    → Create PR
    → Post screenshot comment
11. Wait → team_results → report PR URLs to user
12. team_cleanup
```

### Phase 5 — PR Feedback Loop

```
When user says "I've added comments to the PR":
1. team_spawn name:ob-pullrequest-observer-az agent:ob-pullrequest-observer-az  (Azure DevOps)
   team_spawn name:ob-pullrequest-observer-gh  agent:ob-pullrequest-observer-gh  (GitHub)
   → read threads, classify feedback
2. Wait → team_results → spawn frontend and/or backend in parallel for code-change items
3. Wait → team_results → team_spawn name:qa → review fixes
4. Wait → team_results → team_spawn name:ob-pullrequest-*-creator → commit, push, update PR
5. Wait → team_results → team_cleanup
```

## Branch Naming

Format: `feature/{issue-id}-{slug}`
Example: `feature/42-add-user-auth`

---

## Project Structure

```
[project-root]/
└── Copilots/              ← THIS FOLDER (agent orchestration)
    ├── .opencode/         # OpenCode config and skills
    │   ├── agents/        # Agent definitions
    │   └── skills/        # Agent skill definitions
    ├── openspec/          # OpenSpec artifacts
    │   ├── specs/         # Project specs (permanent)
    │   └── changes/       # Change tracking
    │       └── {change}/  # Per-change folder
    │           └── images/ # Screenshots for PR comments (git-tracked)
    ├── AGENTS.md          # Agent guidance (THIS FILE)
    ├── ARCHITECTURE.md    # System architecture
    ├── DESIGN.md          # Design tokens and UI guidelines
    └── README.md          # Project readme
```

## Tech Stack

- OpenCode CLI — AI agent execution
- OpenSpec — Spec-driven workflow
- opencode-ensemble — Multi-agent parallel execution

## Commands

```bash
# OpenSpec
openspec new change "<name>"
openspec list
openspec status --change "<name>"
openspec instructions apply --change "<name>" --json

# Skills are in .opencode/skills/{skill-name}/SKILL.md
```

## Available Agent Skills

| Skill | Purpose |
|-------|---------|
| `ob-userstory-az` | Parse Azure DevOps US URL, create OpenSpec change |
| `ob-userstory-gh` | Parse GitHub Issue URL, create OpenSpec change |
| `openspec-propose` | Propose change artifacts (proposal, design, specs, tasks) |
| `openspec-apply-change` | Implement change with multi-agent team |
| `openspec-archive-change` | Archive completed change |
| `openspec-explore` | Explore ideas before creating a change |

## Available Agents (Spawned via ensemble — never called directly)

| Agent | File | Purpose |
|-------|------|---------|
| `frontend` | .opencode/agents/frontend.md | Frontend implementation |
| `backend` | .opencode/agents/backend.md | Backend implementation |
| `qa` | .opencode/agents/qa.md | Reviews code against acceptance criteria |
| `ob-pullrequest-creator-az` | .opencode/agents/ob-pullrequest-creator-az.md | Screenshots, commit, push, create Azure DevOps PR |
| `ob-pullrequest-observer-az` | .opencode/agents/ob-pullrequest-observer-az.md | Reads Azure DevOps PR feedback, triggers agents |
| `ob-pullrequest-creator-gh` | .opencode/agents/ob-pullrequest-creator-gh.md | Screenshots, commit, push, create GitHub PR |
| `ob-pullrequest-observer-gh` | .opencode/agents/ob-pullrequest-observer-gh.md | Reads GitHub PR feedback, triggers agents |

## Guardrails

### Images in PR Comments — Repo-Hosted

**Never upload images as PR attachments.** Screenshots are saved to the openspec change `images/` folder and referenced via raw URL.

| Step | Action |
|------|--------|
| Save screenshot | `openspec/changes/{change}/images/{file}.png` |
| Azure DevOps raw URL | `https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/items?path=openspec/changes/{change}/images/{file}.png&versionType=branch&version={branch}&api-version=7.1` |
| GitHub raw URL | `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/openspec/changes/{change}/images/{file}.png` |

### Platform CLI — CRITICAL

**ALL Azure DevOps interactions via `az` CLI. ALL GitHub interactions via `gh` CLI. Browser MCP FORBIDDEN for any DevOps or GitHub operation.**

| Operation | Azure DevOps | GitHub |
|-----------|-------------|--------|
| Read issue/US | `az boards work-item show --id <id>` | `gh issue view <number>` |
| Read PR threads | `az devops invoke ...` | `gh pr view <number> --comments` |
| Create PR | `az repos pr create ...` | `gh pr create ...` |
| Reply to thread | `az devops invoke ...` | `gh api .../replies` |

Browser MCP tools permitted only for screenshots of **local running app** on `localhost` URLs.

### Security — CRITICAL

Agents CANNOT:
- ❌ Access `.env` or config files with secrets
- ❌ Log or output credentials, API keys, or tokens
- ❌ Commit secrets to git

### Git Operations

Agents CAN:
- ✅ Commit to feature branches
- ✅ Push to feature branches

Agents CANNOT:
- ❌ Commit or push to `main` — FORBIDDEN
- ❌ Force push — FORBIDDEN
- ❌ Merge PRs — human-only
- ❌ Create or delete branches other than `feature/*`

### Scope Limits
- Max 10 files per change
- No architecture changes without human approval
- No pipeline modifications

## Communication Style

Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".

# AGENTS.md, Bootstrap Mode

> This project has not been initialized yet.
> Your ONLY job right now is to run the initialization sequence below.
> Do not do anything else until all steps are complete.

## Trigger

When the user says anything resembling initialization, "init", "initialize", "setup", "start", "bootstrap", "get started", "prepare", execute the steps below. Follow the greenfield/brownfield branching exactly.

---

## Initialization Sequence

### Step 1, Detect project type

Ask the user exactly this question before doing anything else:

> "Is this a **greenfield** project (starting from scratch, little or no existing code) or a **brownfield** project (existing codebase)?"
>
> - Reply **greenfield** to skip architecture/design/history analysis
> - Reply **brownfield** to generate docs from your existing code

Wait for the answer. Then follow the matching path below.

---

### Greenfield path

Skip steps 2, 3, and 4. Jump directly to Step 5.

Greenfield note: `ARCHITECTURE.md` and `DESIGN.md` are left as placeholders. Run `/ob-create-architecture` and `/ob-create-design` once the codebase has meaningful content.

---

### Brownfield path

#### Step 2, Archive project history into OpenSpec

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

#### Step 3, Generate ARCHITECTURE.md

Run `/ob-create-architecture` now. Follow every step defined in that command.

---

#### Step 4, Generate DESIGN.md

Run `/ob-create-design` now. Follow every step defined in that command.

---

### Step 5, Populate OpenSpec config

Write `openspec/config.yaml` with real project information. For greenfield projects, use what little is known (language choice, intended stack, domain). For brownfield, use what was discovered in steps 2–4.

The output must contain `schema: spec-driven` and a populated `context:` block. Do not leave placeholder text.

```yaml
schema: spec-driven

context: |
  Tech stack: <languages, frameworks, libraries found in the codebase>
  Build system: <build tools, package managers>
  Architecture: <monolith, microservices, monorepo, etc.>
  Conventions: <coding style, commit conventions, branching strategy if found>
  Domain: <what this project does, in one line>
```

Replace every `<…>` with real values. Add a `rules:` section only if the codebase has clear conventions worth enforcing. Do not invent rules that aren't evidenced by the codebase.

---

### Step 6, Rewrite this file

Replace the entire contents of this file (`AGENTS.md`) with everything below the line `<!-- AGENTS-TEMPLATE-START -->` in this same file. Delete the bootstrap section and the template marker, the file should contain only the template content when done.

---

### Step 7, Confirm

For **brownfield**, tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ARCHITECTURE.md generated
- DESIGN.md generated
- openspec/config.yaml populated
- Project history archived in openspec
- AGENTS.md updated with real guidance

!! RESTART OPENCODE NOW !!

Quit and reopen OpenCode before doing anything else.
Nothing will work correctly until you do.
After restarting you are ready to work.
```

For **greenfield**, tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete (greenfield).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- openspec/config.yaml populated
- AGENTS.md updated with real guidance
- ARCHITECTURE.md and DESIGN.md left as placeholders

Once your codebase has meaningful content, run:
  /ob-create-architecture   → generate architecture docs
  /ob-create-design         → generate design system docs

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
- Only read source files for analysis, write only to ARCHITECTURE.md, DESIGN.md, AGENTS.md, openspec/config.yaml, and openspec/

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

**Never delegate without a plan. Default to specialists for implementation. If ensemble is clearly non-functional in the current session (idle teammate, no claim, or repeated spawn failure after one retry), stop forcing it: report the failure, then continue in the main session or ask the user whether to retry later.**

## Engineer Selection

Before spawning implementation workers:
- Inspect `.agents/agents/*.md` and build the list of engineers that actually exist in this project.
- Exclude `devops-manager` from implementation selection.
- Prefer the most specialized custom engineer whose description and abilities clearly match the task domain.
- Use `basic-engineer` only when no custom engineer is a clear fit or as a recovery fallback.
- Never spawn engineer names that are not present in `.agents/agents/`.
- When multiple engineers could fit, choose the narrower specialist before the generalist.

## Multi-Agent Execution, opencode-ensemble

Parallel execution uses the `opencode-ensemble` plugin (`team_create`, `team_spawn`, etc.).
Works on **all platforms** (Windows, macOS, Linux) via OpenCode's built-in worktree support.

Core tools used in this workflow:
- `team_create`, `team_spawn`, `team_shutdown`, `team_merge`, `team_cleanup`
- `team_tasks_add`, `team_tasks_list`, `team_claim`, `team_tasks_complete`
- `team_message`, `team_results`, `team_status`

**Dashboard**: Monitor running agents at **http://localhost:4747/**

**Hard limits:**
- **Sequential by default.** Default `{{MAX_CONCURRENT_AGENTS}}` to `1`. Raise only when tasks are provably independent and user approves. More concurrency = more tokens burned in parallel.
- **Max {{MAX_CONCURRENT_AGENTS}} truly concurrent agents.** All {{MAX_CONCURRENT_AGENTS}} must be spawned and running simultaneously, not sequentially. Spawn in waves if more than {{MAX_CONCURRENT_AGENTS}} are needed. Wait for wave N to finish before spawning wave N+1.
- **Non-overlapping file domains.** Each agent owns exclusive directories. Two agents must NEVER touch the same file.
- **Immediate shutdown on completion.** The moment an agent's domain has no more pending tasks → `team_shutdown` → `team_merge`. Keep agents alive if more tasks in their domain are pending (rolling batch).
- **Rolling batch assignment.** Agents receive up to 3 tasks initially. When they complete a batch, lead assigns the next batch of up to 3 from the board. Never leave pending tasks orphaned.
- **Stall detection at 5 minutes.** No commits after 5 min → nudge message → 2 min grace → force shutdown + respawn.
- **Idle-without-claim is an earlier stall.** If a spawned teammate sits idle with no claimed task after a short wait, resend one short claim-only message with the exact task IDs. If still idle, force shutdown + respawn once with a shorter prompt. If the retry repeats the same failure, treat ensemble as unavailable for that session and stop recycling equivalent workers.
- **Retry limit.** Max 3 retries per failing task → stop-and-report to user. Never retry indefinitely.

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
0. Run /quota to check remaining budget before spawning.
1. Run /opsx-apply.
   - Step 5b: classify cost tier, announce scope, ask user to confirm if ≥4 tasks.
   - Lead adds all tasks to board.
   - When dependencies exist, lead uses multiple `team_tasks_add` waves so later tasks can reference real task IDs returned by earlier waves.
   - Lead discovers available engineers from `.agents/agents/*.md`, prefers matching custom engineers, then spawns engineers with initial batch of up to 3 tasks each (rolling batch model).
   - Each engineer claims tasks, implements, completes, messages lead.
   - Lead assigns next batch (up to 3) to agents that report done. Repeat until board empty.
   - Lead merges each engineer branch after shutdown, then marks tasks done in tasks.md.
2. Verify with tests/build/lint according to task scope.
3. Run /quota after all agents are merged.
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

User can add more custom engineer agents and run them in parallel. Keep behavior ability-driven via skill mappings. Custom engineers are the primary specialization mechanism; `basic-engineer` is the general fallback when no custom engineer is a clear fit.

Default `basic-engineer` abilities:

```
## Abilities
- Guardrails: @ob-generic-guardrails, @ob-default
- Development: @ob-default
- Testing: @ob-default
- Infrastructure: @ob-default
```

## Skills

Skills provide platform and tech-specific knowledge. Agents usually detect and load them automatically. Prefer auto-detection, but explicitly naming a skill in a spawn prompt is allowed when a workflow requires it or repeated misses show the agent is not loading the right context.

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

### Config file conflict: `opencode.jsonc` vs `.opencode/opencode.json`

This project uses `.opencode/opencode.json` as the single OpenCode configuration file. Some tools (e.g., codegraph) may create an `opencode.jsonc` file at the project root. **These two files cannot coexist.**

If you detect both `opencode.jsonc` (project root) and `.opencode/opencode.json` exist:
1. **Stop immediately** and warn the user: "Conflicting OpenCode config files detected. This project uses `.opencode/opencode.json` only. The root `opencode.jsonc` must be removed or its contents merged into `.opencode/opencode.json`."
2. Do NOT proceed with any task until the conflict is resolved.
3. If the user asks you to fix it: merge any `mcpServers` or other config from `opencode.jsonc` into `.opencode/opencode.json`, then delete `opencode.jsonc`.

---

## Token Budget & Safety

Prevent runaway token spend from unattended sessions. Apply in this priority order.

### 1. Provider-side caps (primary safety layer)

Set monthly soft-limit + hard usage cap in your provider dashboard **before** running any agent session:
- **OpenAI**: [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com)
- **Google AI Studio**: [aistudio.google.com/app/usage](https://aistudio.google.com/app/usage)

Provider caps are the only guarantees that survive agent bugs, infinite loops, or runaway retries.

### 2. Model-cost routing

| Task type | Model tier |
|-----------|-----------|
| Orchestration loops, task classification, status checks, PR parsing, triage | Fast / cheap (e.g. `haiku`, `gpt-4o-mini`) |
| Implementation, code review, hard reasoning | Expensive (e.g. `sonnet`, `opus`, `gpt-4o`) |

devops-manager orchestrates — use fast model for it. Engineers implement — use expensive model there only.

### 3. Sequential-by-default concurrency

Default: **1 agent at a time**. Set `{{MAX_CONCURRENT_AGENTS}}` to `1` unless tasks are provably independent and the user approves higher concurrency. More agents = more tokens burned in parallel; slow down unless scope justifies it.

### 4. Retry limits

Max **3 retries** per failing task. On the third failure:
1. Shut down the stuck agent.
2. Summarize what failed and why.
3. Stop — wait for user guidance before retrying.

Never silently retry indefinitely. Repeated failures = a design problem, not a retry problem.

### 5. Inactivity and time cutoffs

- **No commits after 10 minutes** of cumulative agent runtime → auto-stop, summarize blockers to user.
- **Max 1 hour** total runtime per `/opsx-apply` session → stop and report at the limit, regardless of remaining tasks.

### 6. Quota checkpoints

Use the `opencode-quota` plugin (`/quota` command) to surface real-time token usage:
- Run `/quota` at **session start** (before spawning any agents) and **after each agent wave**.
- "When to stop" thresholds:
  - **50% consumed** → review remaining scope; consider reducing
  - **75% consumed** → pause; summarize completed work; ask user whether to continue
  - **90% consumed** → stop immediately; ship what's done; open follow-up change for remainder

---

## Communication Style

Terse. Technical substance exact. Only fluff die.
Drop: articles, filler, pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].

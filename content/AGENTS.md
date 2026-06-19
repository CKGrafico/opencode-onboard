# AGENTS.md, Bootstrap Mode

> This project has not been initialized yet.
> Your ONLY job right now is to run the initialization sequence below.
> Do not do anything else until all steps are complete.

## Trigger

When the user says anything resembling initialization, "/ob-init", "initialize", "setup", "start", "bootstrap", "get started", "prepare", execute the steps below. Follow the greenfield/brownfield branching exactly.

---

## Initialization Sequence

### Step 1, Detect project type

Use the **AskUserQuestion tool** (not plain text) to present this choice:

- Question: `"Is this a greenfield or brownfield project?"`
- Options:
  - `greenfield` — Starting from scratch, little or no existing code. Skip architecture/design/history analysis.
  - `brownfield` — Existing codebase. Generate docs from your code.

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

### Step 6, Install OpenCode plugins

OpenCode plugins declared in `.opencode/opencode.json` (under the `plugin` key) must be present in `.opencode/node_modules/` or OpenCode will fail to load them. The plugins are also listed in `.opencode/package.json` as dependencies.

```bash
cd .opencode
npm install
cd ..
```

This installs all plugin packages into `.opencode/node_modules/`. If you ever see "Plugin X not found" errors after init, run `npm install` in `.opencode/` again.

---

### Step 7, Rewrite this file

Replace the entire contents of this file (`AGENTS.md`) with everything below the line `<!-- AGENTS-TEMPLATE-START -->` in this same file. Delete the bootstrap section and the template marker, the file should contain only the template content when done.

---

### Step 8, Confirm

For **brownfield**, tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ARCHITECTURE.md generated
- DESIGN.md generated
- openspec/config.yaml populated
- Project history archived in openspec
- OpenCode plugins installed
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
- OpenCode plugins installed
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
- `npm install` (step 6) is allowed to modify `.opencode/package-lock.json` and `.opencode/node_modules/`

<!-- AGENTS-TEMPLATE-START -->
# AGENTS.md

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic, works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Project Overview

This is the agent orchestration layer for your project. It provides:
- Universal agent team for development workflow
- OpenSpec change management
- Skills for platform and task-specific knowledge

## Context

Load DESIGN.md for design principles and guidelines. Load ARCHITECTURE.md for system architecture and component interactions. These files are generated during initialization and updated as the codebase evolves.

## I Am the Lead, Full Workflow Ownership

<!-- OB-PLATFORM-WORKFLOW-START -->
When the user provides a work item URL or says "implement the plan" or "I've added comments to the PR", **I own the full lifecycle**. I load `ob-global` skill first, then the appropriate userstory skill, and coordinate implementation as native subagent waves via `/ob-apply`.

Trigger patterns, I recognize ALL of these, exact wording does not matter:
- User pastes or mentions a GitHub Issue URL → load `ob-userstory` skill → parse issue → run `/ob-propose` → confirm with user → run `/ob-apply` → ship
- User pastes or mentions an Azure DevOps URL → load `ob-userstory` skill → parse work item → run `/ob-propose` → confirm with user → run `/ob-apply` → ship
- `implement the plan` / `implement` / `start` / `go` → run `/ob-apply` → ship
- `I've added comments to the PR` → read PR comments → fix → update PR
- Any GitHub/Azure DevOps PR URL in a feedback/fix request (e.g. "check comments", "fix PR feedback") → run PR Feedback Loop

**A GitHub or Azure DevOps URL anywhere in the user's message is always a trigger, regardless of surrounding words.**
<!-- OB-PLATFORM-WORKFLOW-END -->

**Never delegate without a plan. Default to specialists for implementation. If a subagent wave repeatedly fails (a group errors after one retry, or a full wave makes zero progress), stop forcing it: report the failure, then continue in the main session or ask the user whether to retry later.**

## Engineer Selection

Before spawning implementation workers:
- Inspect `.opencode/agents/*.md` and build the list of engineers that actually exist in this project.
- Prefer the most specialized custom engineer whose description and abilities clearly match the task domain.
- Use `basic-engineer` only when no custom engineer is a clear fit or as a recovery fallback.
- Never spawn engineer names that are not present in `.opencode/agents/`.
- When multiple engineers could fit, choose the narrower specialist before the generalist.

## Multi-Agent Execution, native subagent waves

Parallel execution uses OpenCode's native `task` tool — no external plugin, no worktrees. The lead spawns subagents in **waves**: a set of foreground `task()` calls in a single turn that run concurrently and return their results to the lead. Subagents are navigable (`ctrl+x ↓`, `←`/`→`) and ephemeral (one batch, then they exit).

**How a wave works:**
- **Push assignment.** Each subagent's task IDs + text go in its spawn prompt — there is no claim step, so a worker can never sit idle waiting for work.
- **Eligibility.** A task runs only when every `depends_on` is done.
- **Conflict safety (no worktrees).** Concurrent subagents must touch disjoint files (codegraph impact → `touches` globs → `git diff`). Same-file tasks are packed into one worker and run sequentially.
- **Checkpoints.** The lead commits each group on success; on failure it reverts that group's paths and retries once.
- **Per-agent model.** Each engineer's model is set in its own agent file (chosen by tier when the engineer is created); the lead spawns the plain agent name.

**Hard limits:**
- **Max {{MAX_CONCURRENT_AGENTS}} concurrent subagents per wave** (set during onboarding, 1–5). The lead enforces the cap by emitting at most that many `task()` calls per turn; overflow queues to the next wave.
- **Non-overlapping file domains.** Two concurrent subagents must NEVER touch the same file.
- **Explicit stalls.** If tasks remain but none are eligible (a dependency failed), or a full wave makes zero progress, STOP and report — never spin.
- **Retry limit.** One retry per failed group, then surface to the user. Never retry indefinitely.

**Live view:** the lead's native Todo list is the board; the `ob-subagent-monitor` plugin also writes `.opencode/.ob-run.json`. Navigate into any running subagent with `ctrl+x ↓` then `←`/`→`.

**Recovery:** re-run `/ob-apply` — it rebuilds state from `tasks.md` + git + basic-memory + `.opencode/.ob-run.json` and continues. State is on disk, not in the session.

**MCP degradation:** if codegraph or basic-memory is unavailable, fall back to `touches` + `git diff` for disjointness and inline result-passing, and tell the user.

---

## Pipeline

<!-- OB-PLATFORM-PIPELINE-START -->
Pipeline content is injected here during onboarding based on the selected platform.
<!-- OB-PLATFORM-PIPELINE-END -->

---

## Tools

**OpenSpec** manages the change lifecycle. Each work item becomes a change with a `proposal.md`, specs, and a `tasks.md` task board. Commands: `openspec new change`, `openspec status`, `openspec instructions apply`. Agents never implement without an active change — OpenSpec is the single source of truth for what is planned and what is done.

**Native subagent waves** handle parallel execution via the OpenCode `task` tool — no external plugin or worktrees. The lead spawns concurrent foreground subagents per wave; each implements its assigned tasks and returns its result, and the lead commits per group. Live board in the Todo pane; subagent state mirrored to `.opencode/.ob-run.json` by the `ob-subagent-monitor` plugin.

---

## Agents

Agent files live in `.opencode/agents/`. The set is dynamic — users add specialists over time via `/ob-create-engineer`.

| Agent | File | Role |
|-------|------|------|
| `basic-engineer` | `.opencode/agents/basic-engineer.md` | Fallback implementation worker. Used when no custom engineer matches the task domain. |
| `*-engineer` | `.opencode/agents/*-engineer.md` | User-created specialists. Preferred over `basic-engineer` when their domain matches the task. |

Before spawning, inspect `.opencode/agents/` to build the actual list — never assume which custom engineers exist.

---

## Abilities

Every agent file declares an `## Abilities` section that maps roles to `@skill-name` references. This is how agents know what to load — skills deliver the rules, guardrails, and platform knowledge for each domain.

```markdown
## Abilities
- Guardrails: @ob-generic-guardrails, @ob-default
- Development: @ob-default
- Testing: @ob-default
- Infrastructure: @ob-default
```

`@ob-generic-guardrails` is mandatory in every agent's Guardrails line. Custom engineers replace `@ob-default` with real installed skills.

---

## Skills

Skills live in `.agents/skills/`. Agents load them via `@skill-name` in their `## Abilities` section.

Always installed: `@ob-default`, `@ob-generic-guardrails`, `@browser-automation`.

<!-- OB-PLATFORM-SKILLS-GUIDE-START -->
<!-- OB-PLATFORM-SKILLS-GUIDE-END -->

---

## Optimizations

Active tools injected during onboarding. Empty sections mean that tool was not selected.

<!-- OB-RTK-START -->
<!-- OB-RTK-END -->

<!-- OB-CAVEMAN-START -->
<!-- OB-CAVEMAN-END -->

<!-- OB-CODEGRAPH-START -->
<!-- OB-CODEGRAPH-END -->

<!-- OB-MEMORY-START -->
<!-- OB-MEMORY-END -->

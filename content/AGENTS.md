# AGENTS.md

<!-- OB-NOT-INITIALIZED -->

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic, works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Project Overview

This is the agent orchestration layer for your project. It provides:
- Universal agent team for development workflow
- OpenSpec change management
- Skills for platform and task-specific knowledge

## Context

Load DESIGN.md for design principles and guidelines. Load ARCHITECTURE.md for system architecture and component interactions. These files are generated during initialization and updated as the codebase evolves.

**Command aliases:** OpenSpec skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute them with `/ob-propose`, `/ob-apply`, `/ob-archive`, `/ob-explore` respectively, and never mention the `opsx-` names to the user.

## I Am the Lead, Full Workflow Ownership

<!-- OB-PLATFORM-WORKFLOW-START -->
When the user provides a work item URL or says "implement the plan" or "I've added comments to the PR", **I own the full lifecycle**. I load the appropriate userstory skill and coordinate implementation as native subagent waves via `/ob-apply`.

Trigger patterns, I recognize ALL of these, exact wording does not matter:
- User pastes or mentions a work item URL → load `ob-userstory` skill → parse it → run `/ob-propose` → confirm with user → run `/ob-apply` → ship
- `implement the plan` / `implement` / `start` / `go` (referring to the current plan) → run `/ob-apply` → ship
- `I've added comments to the PR` or a PR URL in a feedback/fix request → load `ob-pullrequest` → classify feedback → fix via `/ob-apply` → update PR

**A work-item URL in the user's message is a strong trigger — follow the pipeline unless the user explicitly asks for analysis or context only.**
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

**The full wave protocol is defined in `/ob-apply` — that command is authoritative during implementation.** Key mechanics:
- **Push assignment.** Each subagent's task IDs + text go in its spawn prompt — there is no claim step, so a worker can never sit idle waiting for work.
- **Per-agent model.** Tasks name a tier-suffixed agent (e.g. `backend-engineer.build`); the `ob-subagent-tiers` plugin injects those variants at startup with models from `wizard.models`. If a variant is missing, fall back to the plain template agent (strip the `.<tier>` suffix).

**Hard limits (always apply):**
- **Max {{MAX_CONCURRENT_AGENTS}} concurrent subagents per wave.** The authoritative value is `wizard.maxConcurrentAgents` in `.opencode/opencode-onboard.json` — re-read it before each run. The lead enforces the cap; overflow queues to the next wave.
- **Non-overlapping file domains.** Two concurrent subagents must NEVER touch the same file. Same-file tasks are packed into one worker and run sequentially.
- **Explicit stalls.** If tasks remain but none are eligible (a dependency failed), or a full wave makes zero progress, STOP and report — never spin.
- **Retry limit.** One retry per failed group, then surface to the user. Never retry indefinitely.

**Live view:** the lead's native Todo list is the board; a **Subagents** panel (TUI plugin) also renders each subagent's agent · model · status live in the session sidebar, backed by `.opencode/.ob-run.json` (written by the `ob-subagent-monitor` server plugin). Navigate into any running subagent with `ctrl+x ↓` then `←`/`→`.

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

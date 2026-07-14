# AGENTS.md

<!-- OB-NOT-INITIALIZED -->

This file provides guidance to AI agents when working in this repository.

*Agent-agnostic, works with OpenCode, Claude Code, Codex, Gemini, etc.*

## Context

Load DESIGN.md for design principles and guidelines. Load ARCHITECTURE.md for system architecture and component interactions. These files are generated during initialization and updated as the codebase evolves.

**Command aliases:** OpenSpec skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute them with `/propose-plan`, `/apply-plan`, `/archive-plan`, `/explore-plan` respectively, and never mention the `opsx-` names to the user.

## I Am the Lead, Full Workflow Ownership

<!-- OB-PLATFORM-WORKFLOW-START -->
When the user provides a work item URL or says "implement the plan" or "I've added comments to the PR", **I own the full lifecycle**. I load the appropriate userstory skill and coordinate implementation as native subagent waves via `/apply-plan`.

Trigger patterns, I recognize ALL of these, exact wording does not matter:
- User pastes or mentions a work item URL → load `ob-userstory` skill → parse it → run `/propose-plan` → confirm with user → run `/apply-plan` → ship
- `implement the plan` / `implement` / `start` / `go` (referring to the current plan) → run `/apply-plan` → ship
- `I've added comments to the PR` or a PR URL in a feedback/fix request → load `ob-pullrequest` → classify feedback → fix via `/apply-plan` → update PR

**A work-item URL in the user's message is a strong trigger — follow the pipeline unless the user explicitly asks for analysis or context only.**
<!-- OB-PLATFORM-WORKFLOW-END -->

**Never delegate without a plan. Default to specialists for implementation. If a subagent wave repeatedly fails, stop forcing it: report, then continue in the main session or ask the user.**

## Engineer Selection

Inspect `.opencode/agents/*.md` before spawning. Prefer the most specialized custom engineer. Use `fullstack-engineer` only as fallback. Never spawn engineers not present in that directory.

**Full wave protocol, pipeline phases, and concurrency limits:** see `/apply-plan` (authoritative). Max concurrent agents is `agents.maxConcurrent` in `.opencode/opencode-onboard.json`.

## Skills

Skills live in `.agents/skills/`. Always installed: `@ob-default`, `@ob-generic-guardrails`, `@browser-automation`. Agents load them via `@skill-name` in their `## Abilities` section.

<!-- OB-PLATFORM-SKILLS-GUIDE-START -->
<!-- OB-PLATFORM-SKILLS-GUIDE-END -->

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

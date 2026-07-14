---
description: Show all available commands and when to use each one.
---

Display the following reference to the user exactly as written. Do not summarize.

## Commands

### Not sure where to start?

**`/onboard-repository`** — Guided tour of the project and its agentic infrastructure. Explains agents, commands, skills, OpenSpec workflow, and configuration. Read-only — no files modified.

**`/explore-plan`** — Your backlog is unclear, you have a half-formed idea, or you need to think through a problem before committing to a plan. This is a thinking partner, not an executor.

**`/propose-plan <url or idea>`** — You have a work item URL, or a clear idea and you want to turn it into a structured plan (proposal, specs, tasks). Enriches each task with the best matching agent and model before showing you the plan. Nothing is implemented until you confirm.

---

### Ready to implement?

**`/simple-plan <task>`** — Quick plan for focused changes. Reads the codebase, shows a task checklist in the conversation. No files, no OpenSpec. Then you decide: `/apply-plan` to implement, or `/propose-plan` for a full OpenSpec plan.

**`/apply-plan`** — Implement a plan. Detects the source automatically: OpenSpec-annotated tasks (from `/propose-plan`) run as parallel subagent waves; in-conversation tasks (from `/simple-plan`) run sequentially in-session.

**`/goal <feature or URL>`** — Fully autonomous, no confirmations. Branches off `main`, then runs propose → apply → archive on that branch (each phase its own commit). Default: merges to `main` and deletes the branch. Add `push` keyword to push the branch only. Add `pr` keyword to push + create a PR. Built for loop-engineering / unattended runs. Stops only on a hard failure, leaving the branch unmerged.

---

### Done implementing?

**`/pull-request`** — Create a PR for the current feature branch. Also handles feedback mode: if you share a PR URL or say "I've added comments to the PR", it reads and classifies the review comments so you know what to fix.

**`/archive-plan`** — Mark a completed change as archived in OpenSpec. Run this after the PR is merged.

---

### Maintaining the project?

**`/make-engineer`** — Add a custom specialist engineer to the team. Interactive persona-driven flow: pick a persona, answer a few questions about your stack, and the command installs the right skills and generates the agent file. Future `/apply-plan` runs will prefer it when its domain matches.

**`/make-architecture`** — Regenerate `ARCHITECTURE.md` from the current codebase. Safe to rerun any time the architecture evolves.

**`/make-design`** — Regenerate `DESIGN.md` from the design system (Tailwind, CSS vars, tokens, etc.).

**`/make-guardrails`** — Generate a `project-guardrails` skill from `ARCHITECTURE.md` and project config files. Extracts concrete rules (architecture boundaries, naming, code style, testing, git workflow) that all agents must follow. Updates every `*-engineer.md` to load the skill.

**`/set-model <tier> <model>`** — Set the model for a tier (`plan`, `build`, or `fast`). Writes to `.opencode/opencode-onboard.json` (`models`). Use `user` prefix for a personal override: `/set-model user fast opencode/big-pickle`. Use a model id or `current` for the active session model. Restart opencode for the `ob-subagent-tiers` plugin to rebuild tier agents.

---

### Typical workflows

**Complex change:**
```
/explore-plan   ← optional: think it through first
/propose-plan   ← create the plan
/apply-plan     ← implement with the team
/pull-request   ← ship
/archive-plan   ← close out
```

**Quick change:**
```
/simple-plan    ← create a focused task list
/apply-plan     ← implement
```

**Unattended / loop-engineering:**
```
/goal <description>  ← full pipeline, no interaction
```

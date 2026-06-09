---
description: Show all available /ob-* commands and when to use each one.
---

Display the following reference to the user exactly as written. Do not summarize.

## ob-onboard commands

### Not sure where to start?

**`/ob-explore`** — Your backlog is unclear, you have a half-formed idea, or you need to think through a problem before committing to a plan. This is a thinking partner, not an executor.

**`/ob-propose <url or idea>`** — You have a work item URL, or a clear idea and you want to turn it into a structured plan (proposal, specs, tasks). Enriches each task with the best matching agent and model before showing you the plan. Nothing is implemented until you confirm.

---

### Ready to implement?

**`/ob-apply`** — You have confirmed a plan from `/ob-propose` and you want to implement it. Spawns engineers in parallel via opencode-ensemble. Each engineer claims a task, implements, commits, and reports back.

**`/ob-main <task>`** — Skip the whole OpenSpec/ensemble flow. Just do the task directly in the current session. Best for small, focused changes that don't need a plan or parallel agents.

---

### Done implementing?

**`/ob-pullrequest`** — Create a PR for the current feature branch. Also handles feedback mode: if you share a PR URL or say "I've added comments to the PR", it reads and classifies the review comments so you know what to fix.

**`/ob-archive`** — Mark a completed change as archived in OpenSpec. Run this after the PR is merged.

---

### Maintaining the project?

**`/ob-create-engineer <name> "<description>"`** — Add a custom specialist engineer to the team. Installs the right skills from skills.sh automatically. Future `/ob-apply` runs will prefer it when its domain matches.

**`/ob-create-architecture`** — Regenerate `ARCHITECTURE.md` from the current codebase. Safe to rerun any time the architecture evolves.

**`/ob-create-design`** — Regenerate `DESIGN.md` from the design system (Tailwind, CSS vars, tokens, etc.).

---

### Typical workflow

```
/ob-explore      ← optional: think it through first
/ob-propose      ← create the plan
/ob-apply        ← implement with the team
/ob-pullrequest  ← ship
/ob-archive      ← close out
```

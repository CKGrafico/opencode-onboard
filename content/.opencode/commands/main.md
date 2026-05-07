---
description: Quick direct implementation — no OpenSpec, no ensemble, no PRs. Just do it.
---

Implement the task described after `/main` directly and immediately.

**Rules:**
- No OpenSpec artifacts (no proposal, no specs, no tasks.md)
- No ensemble team (no team_create, no team_spawn)
- No branches, no PRs
- Work directly in the current branch
- Keep changes minimal and focused on exactly what was asked
- Use Read/Glob/Grep to locate relevant files before editing
- After editing, run `pnpm run typecheck` to catch type errors; fix any that are caused by your changes
- Do NOT run lint or tests unless the user asks

**Input**: Everything after `/main` is the task. Execute it now. 

---
name: ob-generic-guardrails
description: Generic guardrails, foundational rules that all agents follow. Users add specialized guardrails skills for specific concerns. Covers git, secrets, code quality, and security rules.
license: MIT
---

## Git

- NEVER commit or push to main
- NEVER force push
- NEVER merge PRs (human-only)
- Feature branches only: `feature/*` or `bugfix/*`

## Secrets

- NEVER read or output .env files
- NEVER log credentials, API keys, tokens
- NEVER commit secrets to git

## Code

- Run tests before marking done
- Run lint/build before pushing
- Keep changes small and focused

## Security

- Validate all inputs
- Escape all outputs
- No hardcoded credentials

## Communication

- Ask for clarification if unclear
- Report blockers immediately
- Show progress when asked

## Engineer workflow (when spawned)

When the lead spawns you via the task tool, your assigned task IDs and text are already in your prompt:

1. Load the skills listed under your own `## Abilities` for the task domain.
2. If available, read shared context from basic-memory (`search` the change-context note and any `task-<id>-result` notes your dependencies produced) and use `codegraph_search` to locate relevant symbols.
3. Implement your assigned tasks in dependency order. Edit only files within your assigned scope.
4. Run the project's tests/lint before marking done (see **Code** above).
5. If available, write a `task-<id>-result` note to basic-memory summarizing what you changed and any decisions.
6. Return a concise summary — that is your result to the lead. Then you exit; you do not poll, claim, or wait for more work.

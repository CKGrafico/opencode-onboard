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

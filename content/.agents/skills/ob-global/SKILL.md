Generic skill — common project-level guidance loaded by all agents. Provides baseline rules; specialized skills add specific concerns.

## When loaded

Load this skill first in any session. All other skills add to it, never replace it.

## Context

- Load DESIGN.md first for design principles and guidelines.
- Load ARCHITECTURE.md for system architecture and component interactions.

## Source Roots

<!-- OB-SOURCE-ROOTS-START -->
Source roots are generated during onboarding from the user's source-scope selection.
Read and analyze code ONLY from those generated roots.

If multiple roots are generated, each root is an independent git repository. Branch, commit, push, and PR operations must be handled per repository.
<!-- OB-SOURCE-ROOTS-END -->

## Git Guardrails

- NEVER commit or push to main
- NEVER force push
- NEVER merge PRs (human-only)
- Feature branches only: `feature/*` or `bugfix/*`

## Secrets Guardrails

- NEVER read or output .env files
- NEVER log credentials, API keys, tokens
- NEVER commit secrets to git

## Code Quality

- Run tests before marking done
- Run lint/build before pushing
- Keep changes small and focused
- Ask for clarification if unclear

## Token Optimization Rules

<!-- OB-RTK-START -->
RTK rules are generated here when RTK is selected during onboarding.
<!-- OB-RTK-END -->

<!-- OB-CAVEMAN-START -->
Caveman rules are generated here when Caveman is selected during onboarding.
<!-- OB-CAVEMAN-END -->
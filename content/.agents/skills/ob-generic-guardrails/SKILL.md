---
name: ob-generic-guardrails
description: Generic guardrails, foundational rules that all agents follow. Users add specialized guardrails skills for specific concerns. Covers secrets, code quality, security, tool usage, and engineer workflow.
license: MIT
---

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

<!-- OB-GUARDRAILS-RTK-START -->
<!-- OB-GUARDRAILS-RTK-END -->

<!-- OB-GUARDRAILS-CODEGRAPH-START -->
<!-- OB-GUARDRAILS-CODEGRAPH-END -->

<!-- OB-GUARDRAILS-MEMORY-START -->
<!-- OB-GUARDRAILS-MEMORY-END -->

<!-- OB-GUARDRAILS-CAVEMAN-START -->
<!-- OB-GUARDRAILS-CAVEMAN-END -->

<!-- OB-GUARDRAILS-HUMANIZER-START -->
<!-- OB-GUARDRAILS-HUMANIZER-END -->

## Engineer workflow (when spawned)

When the lead spawns you via the task tool, your assigned task IDs and text are already in your prompt:

1. Load the skills listed under your own `## Abilities` for the task domain.
2. Gather context using available tools (see sections above): search basic-memory for `change-<slug>-context` and any `task-<id>-result` notes from dependencies; use codegraph to locate relevant symbols.
3. Implement your assigned tasks in dependency order. Edit only files within your assigned scope.
4. Run the project's tests/lint before marking done (see **Code** above).
5. Write a `task-<id>-result` note to basic-memory summarizing what you changed and any decisions.
6. Return a concise summary: that is your result to the lead. Then you exit; you do not poll, claim, or wait for more work.

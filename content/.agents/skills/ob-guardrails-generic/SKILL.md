---
name: ob-guardrails-generic
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
- Code must be self-explanatory. Names, structure, and types should tell the reader what the code does. Do NOT add comments that restate what the code already says.
- Comments are for WHY, not WHAT. Use them only when the code does something non-obvious or the reason cannot be inferred from context.
- Keep comment ratio under 10%. If more than 10% of lines in a file are comments, the code is probably not understandable enough. Refactor for clarity instead of commenting.
- DELETE comments that are stale, obvious, or restating code. Every comment must earn its place.
- Each file should have one clear responsibility. Do NOT create catch-all files like `constants.js`, `types.ts`, `config.js`, or `utils.ts` that collect unrelated things from different domains. Split by domain or feature instead (e.g. `user-constants.ts`, `order-types.ts`, `auth-config.ts`).
- A file that imports from many unrelated modules is a sign it should be split into smaller, focused files.

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

1. Load ALL skills listed under your own `## Abilities` now (if you have not already done so from the startup directive in your agent prompt), by calling the `skill` tool once per `@skill-name`. These are mandatory instructions, not passive references — Guardrails first, then the rest.
2. Gather context using available tools (see sections above): search agentmemory for `change-<slug>-context` and any `task-<id>-result` notes from dependencies; use codegraph to locate relevant symbols.
3. Implement your assigned tasks in dependency order. Edit only files within your assigned scope.
4. Run the project's tests/lint before marking done (see **Code** above).
5. Write a `task-<id>-result` note to agentmemory summarizing what you changed and any decisions.
6. Return a concise summary: that is your result to the lead. Then you exit; you do not poll, claim, or wait for more work.

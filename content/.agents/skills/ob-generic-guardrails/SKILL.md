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

## RTK

- If `rtk` is available on PATH, prefix ALL CLI commands with `rtk` (e.g. `rtk git diff`, `rtk pnpm test`). Read-only commands like `cat`, `ls`, `Get-Content` are exempt.
- If `rtk` is not available, run commands directly without the prefix.

## CodeGraph

- If `codegraph_explore` is available in your tools, use it BEFORE grep/read to understand or locate code. One call returns the relevant symbols' verbatim source plus the call paths between them.
- Do NOT run `codegraph` in bash — it is an MCP server, not a CLI tool.
- If codegraph is not available, use standard grep/glob/read for code exploration.

## Basic Memory

- If basic-memory MCP tools are available (`search`, `write_note`, `edit_note`, `build_context`, `recent_activity`), use them for cross-session context: `search` for prior decisions before implementing unfamiliar areas, `write_note` for architecture decisions and cross-agent context.
- Do NOT run `basic-memory` in bash — it is an MCP server.
- If not available, skip memory operations.

## Caveman

- If the `@caveman` skill is loaded, activate caveman mode for all responses.
- No revert unless user says "stop caveman" or "normal mode".

## Engineer workflow (when spawned)

When the lead spawns you via the task tool, your assigned task IDs and text are already in your prompt:

1. Load the skills listed under your own `## Abilities` for the task domain.
2. Gather context using available tools (see sections above): search basic-memory for `change-<slug>-context` and any `task-<id>-result` notes from dependencies; use codegraph to locate relevant symbols.
3. Implement your assigned tasks in dependency order. Edit only files within your assigned scope.
4. Run the project's tests/lint before marking done (see **Code** above).
5. Write a `task-<id>-result` note to basic-memory summarizing what you changed and any decisions.
6. Return a concise summary — that is your result to the lead. Then you exit; you do not poll, claim, or wait for more work.

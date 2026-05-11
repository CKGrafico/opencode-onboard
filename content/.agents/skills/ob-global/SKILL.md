Generic skill, common project-level guidance loaded by all agents. Provides baseline rules; specialized skills add specific concerns.

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

## Ensemble Task Board Rules

When working as a spawned agent in an ensemble team, these rules are mandatory:

**Claim-first execution:**
- Your FIRST tool call after loading skills MUST be `team_claim task_id:<id>`. The dashboard must show your active task immediately.
- Do NOT spend more than 2 tool calls reading/planning before writing code. Claim first, then explore only what's needed for that specific task.

**One task at a time:**
- Claim → implement → build/verify → commit → `team_tasks_complete` → claim next.
- NEVER hold multiple claimed tasks simultaneously.
- NEVER batch completions. Mark done immediately after each commit.

**Commit cadence:**
- After each task passes build: `git add -A && git commit -m "feat: <short description>"`
- ONE task = ONE commit. No multi-task commits.

**Communication discipline:**
- NEVER message lead with "I'm reading" or "I'm planning". Only message when DONE or BLOCKED.
- When DONE: report number of tasks completed + commit count.
- When BLOCKED: report which task, what's blocking, what you tried.

**Stall prevention:**
- If a build fails, fix it immediately (max 3 attempts). Then report blocker.
- If you don't understand a task, message lead asking for clarification. Do NOT guess.
- If a file you need doesn't exist yet (dependency on another agent), report as blocked — don't create stubs.

## Token Optimization Rules

<!-- OB-RTK-START -->
RTK rules are generated here when RTK is selected during onboarding.
<!-- OB-RTK-END -->

<!-- OB-CAVEMAN-START -->
Caveman rules are generated here when Caveman is selected during onboarding.
<!-- OB-CAVEMAN-END -->
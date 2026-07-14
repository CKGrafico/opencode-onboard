# Improve documentation readability and accuracy

## Why

The project underwent significant changes: basic-memory was replaced with agentmemory, all slash commands were renamed from `/ob-*` to `/plan-*`, `/ops-*`, `/make-*`, `/repo-*` prefixes, the `/plan-goal` output modes changed (removed `push` and `pr` keywords, added `branch` keyword), and new optimization tools (codegraph, agentmemory, humanizer) were added. None of these changes are reflected in the README or the docs landing page. There is no CONTRIBUTING.md or SECURITY.md for the open source community. The user wants the docs improved so humans can understand everything, with no abbreviations or cryptic shorthand.

## What Changes

1. **Rewrite README.md** — update all references from `basic-memory` to `agentmemory`, rename all commands from `/ob-*` to their current names (`/repo-initialize`, `/repo-help`, `/plan-explore`, `/plan-propose`, `/plan-quick`, `/plan-apply`, `/plan-goal`, `/plan-archive`, `/make-engineer`, `/make-architecture`, `/make-design`, `/make-guardrails`, `/make-user-model`, `/ops-ship`, `/ops-review`, `/ops-backlog`, `/repo-onboard`), update the `/plan-goal` description to reflect the new `branch` keyword (no more `push` or `pr` keywords), update step 8 description to include all 5 optimization tools, add `/plan-quick` and the `/ops-*` and `/repo-*` commands to the commands table, update the installed file tree to use `fullstack-engineer` instead of `basic-engineer`, replace `basic-memory` with `agentmemory` in all prose, and remove abbreviations throughout.

2. **Update docs/index.html** — replace `basic-memory` with `agentmemory` in meta description, hero subtitle text, and all linked references.

3. **Create CONTRIBUTING.md** — explain how to set up the development environment, run tests, run linting, submit pull requests, the preset-driven architecture convention, and the commit message style.

4. **Create SECURITY.md** — standard security policy for reporting vulnerabilities.

## Non-goals

- Changing the functionality or structure of any source code files
- Updating the content/ template files (those are shipped to users and handled separately)
- Redesigning the docs landing page visual design

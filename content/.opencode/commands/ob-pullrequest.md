---
description: Create a pull request for the current feature branch, or read and triage PR review feedback.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

<!-- OB-CMD-CODEGRAPH-START -->
Use codegraph MCP for code intelligence:
- Use `codegraph_search` to identify all files and symbols touched by this branch.
- Use `codegraph_impact` to understand the blast radius of changes — this makes PR descriptions accurate and helps reviewers understand what to focus on.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP for persistent context:
- `search` for the `proposal-{slug}` and `change-{slug}-context` notes to include the original plan and decisions in the PR body.
- `write_note` with title `pr-{branch-name}` storing the PR URL and review status for future reference.
<!-- OB-CMD-MEMORY-END -->

Load `@ob-pullrequest` skill and follow its instructions.

**Create mode** (default): creates a PR for the current feature branch with screenshots if UI changed.

**Feedback mode** (when user mentions PR comments or review feedback): reads and classifies PR review comments. Reports what needs fixing — does not implement fixes directly. Fixing is done via `/ob-apply`.

---
description: Create a pull request for the current feature branch, or read and triage PR review feedback.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

Load `@ob-pullrequest` skill and follow its instructions.

**Create mode** (default): creates a PR for the current feature branch with screenshots if UI changed.

**Feedback mode** (when user mentions PR comments or review feedback): reads and classifies PR review comments. Reports what needs fixing — does not implement fixes directly. Fixing is done via `/ob-apply`.

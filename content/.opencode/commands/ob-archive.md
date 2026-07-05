---
description: Archive the oldest merged unarchived OpenSpec change and update documentation.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

---

Find the oldest unarchived OpenSpec change that has a completed PR, archive it, update docs, and open an archive PR. No input required.

<!-- OB-CMD-CODEGRAPH-START -->
Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash — use the MCP tools directly.
- `codegraph_impact` when checking if the archived change's specs affect `ARCHITECTURE.md` or `DESIGN.md`.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP tools (NOT CLI commands). Do NOT run `basic-memory` in bash — use the MCP tools directly.
- `search` for the `change-{slug}-context` note and any `task-<id>-result` notes from the change being archived.
- `write_note` with title `archive-{slug}` summarizing what was archived, what docs changed, and the archive PR link.
<!-- OB-CMD-MEMORY-END -->

**Steps**

1. **Prepare working tree**

   ```bash
   REPO_ROOT="$(git rev-parse --show-toplevel)"
   DEFAULT_BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')"
   [ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"
   ```

   1. If the tree has uncommitted changes: `git stash push -u -m "WIP before archive"` and tell the user their work is stashed (it is restored in step 6).
   2. Sync the default branch (skip the pull if there is no `origin` remote):

   ```bash
   git switch "$DEFAULT_BRANCH" && git pull origin "$DEFAULT_BRANCH"
   ```

<!-- OB-PLATFORM-ARCHIVE-START -->
<!-- OB-PLATFORM-ARCHIVE-END -->

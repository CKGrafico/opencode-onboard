---
description: Archive the oldest merged unarchived OpenSpec change and update documentation.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` -> `/ob-propose`, `/opsx-apply` -> `/ob-apply`, `/opsx-archive` -> `/ob-archive`, `/opsx-explore` -> `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.). Load `@ob-global`.

Archive the oldest merged unarchived OpenSpec change, update documentation, and create an archive PR. No input required — the command automatically finds the correct change.

**Steps**

1. **Prepare working tree**

   Resolve the repo root and capture current git state:

   ```bash
   REPO_ROOT="$(git rev-parse --show-toplevel)"
   git branch --show-current
   git status --porcelain
   ```

   If the current branch is not `main` and there are uncommitted changes, stash them:

   ```bash
   git stash push -m "WIP before archive"
   ```

   Warn the user before exit if anything was stashed. Then update `main`:

   ```bash
   git switch main
   git pull origin main
   ```

2. **Get the list of unarchived changes**

   List unarchived changes from the top level of `openspec/changes/`:

   ```bash
   find "$REPO_ROOT/openspec/changes" -mindepth 1 -maxdepth 1 -type d -name 'us-*' | sort
   ```

   If the list is empty, verify the parent directory once:

   ```bash
   ls -la "$REPO_ROOT/openspec/changes"
   ```

   If there are still no unarchived change directories, report a blocker and stop.

<!-- OB-PLATFORM-ARCHIVE-START -->
<!-- OB-PLATFORM-ARCHIVE-END -->

---
description: Archive the oldest merged unarchived OpenSpec change and update documentation.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` -> `/ob-propose`, `/opsx-apply` -> `/ob-apply`, `/opsx-archive` -> `/ob-archive`, `/opsx-explore` -> `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

---

Find the oldest unarchived OpenSpec change that has a completed PR, archive it, update docs, and open an archive PR. No input required.

**Steps**

1. **Prepare working tree**

   ```bash
   REPO_ROOT="$(git rev-parse --show-toplevel)"
   ```

   If not on `main` with uncommitted changes, stash them (`git stash push -m "WIP before archive"`) and warn the user before exit. Then sync `main`:

   ```bash
   git switch main && git pull origin main
   ```

<!-- OB-PLATFORM-ARCHIVE-START -->
<!-- OB-PLATFORM-ARCHIVE-END -->

---
description: Archive a completed OpenSpec change and update documentation. Triggered by /ob-archive <url|changeId> command.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

**Input**: A change ID. (`us-{id}-{slug}` or PR URL)

**Steps:**

1. **Load baseline**
   Load `@ob-global`

2. **Update main branch**
   - Switch to main branch and pull the latest changes to ensure it's up to date:
     ```bash
     git switch main
     git pull origin main
     ```
   - If there are changes in current branch (when switching or pulling), stash them and warn the user.
   - Do not apply the stashed changes to the new archive branch, as the archive branch should only contain the changes related to the merged PR.

3. **Find the change**
   - Try to match a change from `openspec/changes` with the provided change ID or PR URL.
   - If the change is not found, report as a blocker and do not proceed with archiving.

<!-- OB-PLATFORM-ARCHIVE-START -->
<!-- OB-PLATFORM-ARCHIVE-END -->

---
name: ob-plan-archive
description: Archive a completed OpenSpec change and update documentation. Interactive mode finds the oldest merged unarchived change and opens an archive PR; autonomous mode archives a named change in place on the current branch. Invoked by the /plan-archive command (interactive) and the plan-goal pipeline (autonomous).
license: MIT
---

# Plan Archive

## Input

The caller provides (all optional):
- A **mode** (see below). Default: `interactive`.
- In autonomous mode: the **change id** to archive (required in that mode; the caller knows which change it just implemented).

## Modes

- **interactive** (default): full flow below — find the oldest unarchived change with a completed PR, confirm with the user, archive it, update docs with approval, and open an archive PR. No input required.
- **autonomous**: the caller names the change to archive. Skip the working-tree prep, the PR lookup, the confirmation prompt, and the archive-PR step. Instead, archive in place on the current branch:
  1. Load `@openspec-archive-change` skill and follow it to archive the given change by its id.
  2. Compare the archived change's specs against `ARCHITECTURE.md` and `DESIGN.md`; apply any needed doc updates directly (no approval prompt).
  3. If the change was a bug fix or new functionality with important impact, check if `@ob-guardrails-project` exists and update it.
  4. Do not commit or push: the caller owns the git operations.

---

## Interactive flow

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

---
description: Autonomous pipeline - propose, apply, then archive on one branch off main, then merge. For loop-engineering.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

```
/ob-autopilot <feature description | GitHub Issue URL | Azure DevOps URL>
```

Run the full change lifecycle end to end with **no human interaction**: branch off `main`, propose, apply, archive, and merge back. Built for **loop-engineering / unattended runs**.

> **Hard rule — never ask the user to confirm anything.** Skip every checkpoint, confirmation, and "stop and ask" in the underlying commands. The only time you halt is a hard failure (see **Failure policy**). Each phase produces its own commit; the branch merges to `main` only after verification passes.

Input: `$ARGUMENTS`

---

**Phase 0 — Resolve input.**
- If `$ARGUMENTS` is a GitHub Issue or Azure DevOps URL and `.opencode/opencode-onboard.json` → `wizard.platform` is not `none`: load `@ob-userstory` and fetch the work item via CLI. Otherwise treat `$ARGUMENTS` as a direct feature description.
- Derive a short kebab-case `{slug}` from the title/description for the initial branch name.

**Phase 1 — Branch from main (before anything else).**
- Ensure a clean tree. If there are uncommitted changes, `git stash push -u -m "autopilot-wip"` and remember to restore in Phase 5.
- Sync and branch:
  ```bash
  git switch main && git pull origin main
  git switch -c feature/{slug}
  BRANCH="$(git branch --show-current)"
  ```
- Everything below happens on `$BRANCH`. `main` is never modified until the final merge.

**Phase 2 — Propose (no confirmation).**
- Run the `/ob-propose` protocol with these overrides: **skip its Step 0 unarchived-changes prompt** (treat the answer as `continue`), do **not** pause at the enrichment checkpoint, and **skip the final "Stop / ask the user" step**. Enrich silently.
- Load `@openspec-propose`, generate `proposal.md`, specs, and `tasks.md`, then annotate every task line with `<!-- agent, depends_on, touches -->` exactly as `/ob-propose` specifies (agent carries the model; `depends_on` mandatory; `touches` best-effort).
- If the canonical change slug differs from `{slug}`, rename the branch to match: `git branch -m feature/{change-slug}` and refresh `BRANCH="$(git branch --show-current)"`.
- Commit: `git add -A && git commit -m "propose: {title} ({change-id})"`.

**Phase 3 — Apply (no confirmation).**
- Run the `/ob-apply` Step 6 wave protocol to completion. You are already on `$BRANCH`, so **skip its branch-creation step (1)**; start from "Load the plan".
- Spawn subagent waves by `depends_on` / `touches`, committing each group `"{ids}: {summary}"` as that protocol dictates. Honour `wizard.maxConcurrentAgents`.
- Do **not** return control to the user between waves — keep looping until every task is DONE, or the progress guard / one-retry limit trips (→ **Failure policy**).
- Run the verify step (tests / lint / build) from this lead session. Reopen and re-wave failing tasks as the protocol allows.
- Ensure `tasks.md` is fully checked and any residual changes are committed.

**Phase 4 — Archive (forced, same branch, no PR).**
- Do **not** run the platform PR archive flow and do **not** create an `archive/` branch. Archive in place on `$BRANCH`.
- Load `@openspec-archive-change` and archive the change you just implemented, by its id.
- Compare the archived change's specs against `ARCHITECTURE.md` and `DESIGN.md`; apply any needed doc updates directly (no approval prompt).
- Commit: `git add -A && git commit -m "archive: {title} ({change-id})"`.

**Phase 5 — Merge to main.**
- Proceed only if Phase 3 verification passed and the tree is clean. Otherwise → **Failure policy**.
- ```bash
  git switch main && git pull origin main
  git merge --no-ff "$BRANCH" -m "autopilot: {title} ({change-id})"
  ```
- On a merge conflict you cannot resolve cleanly and automatically: `git merge --abort`, stay on `main`, and report (→ **Failure policy**). Never commit a conflicted or broken merge.
- If the loop runs against a remote and the project ships `main` automatically, also `git push origin main`. (Skip if no `origin` / protected branch.)
- If you stashed in Phase 1, `git stash pop`.

**Phase 6 — Report.** One summary block: change id, branch, tasks N/N done, the commits made (propose / apply group commits / archive / merge), verification result, and merged-to-main status.

---

**Failure policy (the only stops).** Autopilot never asks for input, but it MUST halt instead of shipping broken work when:
- propose produces no tasks,
- a wave stalls (no eligible tasks while tasks remain) or a task exhausts its single retry,
- verification (tests / lint / build) fails and cannot be cleared by re-waving,
- a merge conflict cannot be auto-resolved.

On any of these: **STOP**, leave `$BRANCH` intact and unmerged, and report exactly what failed and where. For loop-engineering, a clean failure with the branch preserved is the correct outcome — never merge unverified code into `main`.

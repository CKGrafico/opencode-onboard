3. **Resolve the oldest merged unarchived change**

   List all merged PRs in the repo using Azure CLI:
   
   ```bash
   az repos pr list --repository {repo} --status completed --query "sort_by(@, &closedDate)[].{name:title,sourceRefName:sourceRefName,closedDate:closedDate}"
   ```

   For each unarchived change, try to find a matching PR from the list of merged PRs, using the change ID and slug as search hints.

   Handle PR matches:
   - No results → record as blocked: `no merged PR found`
   - Exactly one result → keep as the resolved PR
   - Multiple results → ask the user to pick the correct PR for that change by number or PR ID

   Build two lists:
   - `eligible`: changes with one resolved merged PR
   - `blocked`: changes with no resolved merged PR

   If `eligible` is empty, report a blocker and stop.

   Sort `eligible` by `closedDate` ascending and display the ordered list. Include blocked items separately. Example:

   ```text
   Unarchived changes, ordered by merge date (oldest first):

   1. us-195435-secure-external-lb-iap (merged 2026-05-15T09:22:00Z) <- OLDEST
   2. us-195448-update-service-names-and-repo (merged 2026-05-18T11:44:00Z)
   3. us-195462-update-ssl-certs-and-routing (merged 2026-05-20T14:32:00Z)

   Blocked from archiving:
   - us-195499-some-change (no merged PR found)
   ```

   Select the first `eligible` item as the archive candidate. Carry its already-resolved PR metadata forward — do not run a second PR lookup.

4. **Confirm the candidate**

   Display the resolved candidate and wait for confirmation:

   ```text
   Oldest unarchived merged change found:
     ID: us-{id}-{slug}
     Title: {title from resolved PR}
     PR ID: {pullRequestId}
     Merged: {closedDate}

   Proceed with archiving? [yes/no]
   ```

   Stop if the user does not confirm.

5. **Archive and update docs**

   Create the archive branch:

   ```bash
   git checkout -b archive/{id}-{slug}
   ```

   Archive the change through OpenSpec:

   ```bash
   openspec archive "us-{id}-{slug}"
   ```

   Review documentation impact:
   - Read `$REPO_ROOT/openspec/changes/archive/us-{id}-{slug}/specs/` if the archive moved the change, or `$REPO_ROOT/openspec/changes/us-{id}-{slug}/specs/` if not yet moved.
   - Compare the implemented change with `ARCHITECTURE.md` and `DESIGN.md`.
   - If documentation updates are needed, show the proposed changes and get user approval before applying them.

   Commit and push:

   ```bash
   git add -A
   git commit -m "archive(us-{id}): {title from resolved PR}"
   git push origin archive/{id}-{slug}
   ```

   Create the archive PR:

   ```bash
   az repos pr create \
     --repository {repo} \
     --source-branch refs/heads/archive/{id}-{slug} \
     --target-branch refs/heads/main \
     --title "archive(us-{id}): {title}" \
     --description "Archive SDD artifacts for us-{id} after merge of {sourceRefName}." \
     --auto-complete
   ```

   Record the archive PR URL and ID. If work was stashed in step 1, restore it after the archive flow completes unless the user opts out.

6. **Report**

   Display:

   ```text
   Archive complete

     Change ID: us-{id}-{slug}
     Title: {title}
     Original PR: {original-pr-link}
     Archive PR: {archive-pr-link}

     Documentation updates:
     - ARCHITECTURE.md: {count} changes applied
     - DESIGN.md: {count} changes applied
   ```

   Stop immediately with a clear error if any of these blockers are encountered:
   - No unarchived change directories under `$REPO_ROOT/openspec/changes/`
   - No unarchived change has a resolved merged PR
   - Azure CLI PR queries fail
   - The selected PR is not `completed`

## Rules

- All OpenSpec paths must resolve from the git repository root (`git rev-parse --show-toplevel`). Never use `/openspec/...`.
- Use `--repository {repo}` when querying PRs, where `{repo}` is the resolved repository name.
- Use change ID and slug only as search hints. Do not assume the exact source branch name.
- Display the full sorted list of eligible unarchived changes before asking for confirmation.
- The oldest eligible merged change is the only archive candidate. Never ask the user which change to archive.
- If multiple PRs match a specific change, ask the user which PR belongs to that change.
- Only process top-level directories in `$REPO_ROOT/openspec/changes/`. Exclude archived locations.
- All archive commits and pushes must use `archive/{id}-{slug}` branches.
- Never proceed if the selected PR is not merged.
- Never use browser tools or direct web requests for Azure DevOps. Use `az` CLI only.
- Never invent or guess PR, branch, or merge metadata.


























4. **Find oldest unarchived change**
   - Calculate the oldest unarchived change:
     - list all merged PRs ordered by merge date, oldest first
       ```bash
       az repos pr list --repository {repo} --status completed --query "sort_by(@, &closedDate)[].{name:title,url:url}"
       ```
     - compare unarchived changes in `openspec/changes` with the list of merged PRs to find the oldest merged unarchived change.
     - oldest unarchived changes that have already been merged should be archived first, before newer changes can be archived.

   - If the change matched in step 2 is not the oldest, report that there are oldest changes that need to be archived first and do not proceed with archiving. Include the list of unarchived changes in the message and which one should be archived first.
   - If the change matched in step 2 is the oldest, ask the user to confirm that they want to proceed with archiving this change. If the user does not confirm, do not proceed with archiving.

5. **Create archive branch**
   - Create a new branch named `archive/{id}-{slug}` based on main:
     ```bash
     git checkout -b archive/{id}-{slug}
     ```

6. **Archive**

   Step 1: Find PR and verify merged

   ```bash
   az repos pr list \
   --repository {repo} \
   --source-branch feature/{id}-{slug} \
   --status completed
   ```

   - If a matching PR is found, verify that its status is "completed" (merged).
   - If no matching PR is found, or if the PR is not merged, report as a blocker and do not proceed with archiving.

   Step 2: Verify and update AI files

   ```bash
   /opsx-verify us-{id}-{slug} # or /opsx-validate us-{id}-{slug}
   /opsx-archive us-{id}-{slug}
   ```

   Step 3: Update ARCHITECTURE and DESIGN files
   - Review ARCHITECTURE.md and DESIGN.md and find discrepancies compared to the change implementation. Discrepancies include any new architectural decisions, design changes, or implementation details that are not yet captured in the documentation.
   - Make sure all discrepancies are properly documented in ARCHITECTURE.md and DESIGN.md, so the documentation is up to date with the change implementation.
   - Updates to ARCHITECTURE.md and DESIGN.md should be treated as conflicts, so the user must explicitly consent to the changes before they are applied. This ensures that the user reviews and approves all documentation updates related to the change.
   - Let the user know the discrepancies found and the proposed updates to ARCHITECTURE.md and DESIGN.md, and ask for their consent before applying the changes. If the user does not consent, do not apply the updates to the documentation.
   - Only review implementation for this specific change, do not review or update documentation for any other unrelated changes that may be present in the codebase. The focus should be solely on ensuring that the documentation accurately reflects the implementation of the specific change being archived.

   Step 4: Create archive PR

   ```bash
   az repos pr create \
   --repository {repo} \
   --source-branch archive/{id}-{slug} \
   --target-branch main \
   --title "archive(#{id}): {title}" \
   --description "Archive SDD artifacts for {id} after merge."
   ```

7. **Summary**
   Display:
   - Change ID and title
   - Link to new archive PR
   - Changes applied to ARCHITECTURE.md and DESIGN.md

**Rules:**

- ✅ Commit and push to archive branches only
- ✅ Create and comment on PRs via az CLI with explicit `--repository {repo}`
- ✅ All Azure DevOps data MUST come from `az` CLI.
- ✅ Always pass `--repository {repo}` explicitly, never rely on git context to resolve the repo.
- ❌ Never proceed with archiving if the corresponding PR is not merged.
- ❌ Never proceed with archiving if there are older unarchived changes.
- ❌ Never navigate browser to dev.azure.com
- ❌ Never use webfetch, HTTP requests, or browser MCP tools for Azure DevOps operations, even if az CLI fails. If `az` is unavailable, report as a blocker.

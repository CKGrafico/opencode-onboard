3. **Resolve the oldest merged unarchived change**

   List all merged PRs in the repo using Azure CLI:
   
   ```bash
   az repos pr list --repository {repo} --status completed --query "sort_by(@, &closedDate)[].{name:title,sourceRefName:sourceRefName,closedDate:closedDate}"
   ```

   For each unarchived change from the list of unarchived changes (step 2), try to find a matching PR from the list of merged PRs (this step), using the change ID and slug as search hints.

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
   Unarchived changes, ordered by close date (oldest first):

   1. us-195435-secure-external-lb-iap (closed 2026-05-15T09:22:00Z) <- OLDEST
   2. us-195448-update-service-names-and-repo (closed 2026-05-18T11:44:00Z)
   3. us-195462-update-ssl-certs-and-routing (closed 2026-05-20T14:32:00Z)

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

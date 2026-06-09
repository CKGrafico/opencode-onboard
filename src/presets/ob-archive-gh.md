4. **Find oldest unarchived change**
   - Calculate the oldest unarchived change:
     - list all merged PRs ordered by merge date, oldest first
       ```bash
       gh pr list --repo {owner}/{repo} --state merged --json title,url,mergedAt --jq 'sort_by(.mergedAt) | .[] | {name: .title, url: .url}'
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
   gh pr list \
   --repo {owner}/{repo} \
   --head feature/{id}-{slug} \
   --state closed
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
   gh pr create \
   --repo {owner}/{repo} \
   --base main \
   --head archive/{id}-{slug} \
   --title "archive(#{id}): {title}" \
   --body "Archive SDD artifacts for {id} after merge."
   ```

7. **Summary**
   Display:
   - Change ID and title
   - Link to new archive PR
   - Changes applied to ARCHITECTURE.md and DESIGN.md

**Rules:**

- ✅ Commit and push to archive branches only
- ✅ Create and comment on PRs via gh CLI with explicit `--repo {owner}/{repo}`
- ✅ All GitHub data MUST come from `gh` CLI.
- ✅ Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.
- ❌ Never proceed with archiving if the corresponding PR is not merged.
- ❌ Never proceed with archiving if there are older unarchived changes.
- ❌ Never navigate browser to github.com
- ❌ Never use webfetch, HTTP requests, or browser MCP tools for GitHub operations, even if gh CLI fails. If `gh` is unavailable, report as a blocker.

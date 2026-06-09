---
description: Archive a completed OpenSpec change.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

Load `@openspec-archive-change` skill and follow its instructions.


---
description: Archive change and update documentation. Triggered by /ob-archive <url|changeId> command.
---

**Input**: A GitHub Issue URL, Azure DevOps work item URL or change ID.

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
   - Try to match a change (`us-{id}-{slug}`) from `openspec/changes` with the provided URL (`feature/{id}-{slug}`) or change ID (`us-{id}-{slug}`).
   - If the change is not found, report as a blocker and do not proceed with archiving.

4. **Detect platform and load matching skills**
   - GitHub Issue URL → load `ob-archive-gh` and `ob-pullrequest-gh` skills
   - Azure DevOps URL → load `ob-archive-az` and `ob-pullrequest-az` skills
   - Change ID → ask the user to specify which platform the change is from and load the corresponding skills.

5. **Find oldest unarchived change**
   - Calculate the oldest unarchived change:
      - use the `archive mode` of the corresponding pull request skill to list all merged PRs and their corresponding change IDs. 
      - compare unarchived changes in `openspec/changes` with the list of merged PRs to find the oldest merged unarchived change.
      - oldest unarchived changes that have already been merged should be archived first, before newer changes can be archived.
   - If the change matched in step 2 is not the oldest, report that there are oldest changes that need to be archived first and do not proceed with archiving. Include the list of unarchived changes in the message and which one should be archived first.
   - If the change matched in step 2 is the oldest, ask the user to confirm that they want to proceed with archiving this change. If the user does not confirm, do not proceed with archiving.

6. **Create archive branch**
   - Create a new branch named `archive/{id}-{slug}` based on main:
     ```bash
     git checkout -b archive/{id}-{slug}
     ```

7. **Archive**
   - Use the corresponding skill (`ob-archive-gh` or `ob-archive-az`) to apply the necessary changes to archive the change. This may include moving files, updating documentation, or other tasks specific to the platform.
   - Follow the steps in the skill to ensure that all necessary actions are taken to properly archive the change.

8. **Summary**
   Display:
   - Change ID and title
   - Link to new archive PR
   - Changes applied to ARCHITECTURE.md and DESIGN.md

**Rules:**

- Never proceed with archiving if the corresponding PR is not merged.
- Never proceed with archiving if there are older unarchived changes.
- Always create a new archive branch based on main for each change, never reuse branches.

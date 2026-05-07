---
description: Parse a user story URL and produce a plan — proposal, specs, and tasks. Stops before implementation.
---

Parse the work item at the URL provided after `/plan` and produce a full implementation plan.

**Input**: A GitHub Issue URL or Azure DevOps work item URL. Example: `/plan https://github.com/org/repo/issues/42`

**Steps:**

1. **Load baseline**

   Load `@ob-global` first.

2. **Detect URL type and load matching skill**

   - GitHub Issue URL → load `ob-userstory-gh` skill
   - Azure DevOps URL → load `ob-userstory-az` skill

   Follow the skill steps exactly: fetch the issue/work item via CLI and create an OpenSpec change.

3. **Propose**

   Run `/opsx-propose` to generate `proposal.md`, specs, and `tasks.md`.

4. **Show the plan**

   Display:
   - Change name
   - Total number of tasks
   - Full task list summary

5. **Stop**

   Ask the user: "Ready to implement? Type `/opsx-apply` to start."

   Do NOT proceed to implementation. Do NOT run `/opsx-apply` automatically.

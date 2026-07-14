---
description: Create an issue in the backlog platform (GitHub, Azure DevOps, Jira) from a description.
---

The `@ob-backlog` skill is platform-specific. Backlog platform is set in `.opencode/opencode-onboard.json` → `platform.backlog`. Load the skill matching the backlog platform and follow its instructions.

Creates an issue/work item in the backlog platform from the user's description. Returns the issue URL and ID. Does not create an OpenSpec change: use `/plan-propose` with the returned issue URL if you want to turn it into a plan.

Input: `$ARGUMENTS` (the issue title/description)

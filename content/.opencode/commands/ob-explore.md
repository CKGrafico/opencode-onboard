---
description: Think through an idea, investigate a problem, or clarify requirements before creating a change.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).


**Step 0 - Check for unarchived changes**

Before exploring a new idea, inspect `openspec/changes/` (ignore `openspec/changes/archive`).
If any unarchived change (`us-{id}-{slug}`) folders exist, list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the proposal or stop to archive the change first? [continue/stop]
```

If the user answers `stop`, end the command without generating a proposal.
If the user answers `continue`, proceed to the next step.

Load `@openspec-explore` skill and follow its instructions.

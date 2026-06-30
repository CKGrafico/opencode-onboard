---
description: Think through an idea, investigate a problem, or clarify requirements before creating a change.
---

> **Command aliases:** Loaded skills may reference `/opsx-propose`, `/opsx-apply`, `/opsx-archive`, or `/opsx-explore`. Always substitute: `/opsx-propose` → `/ob-propose`, `/opsx-apply` → `/ob-apply`, `/opsx-archive` → `/ob-archive`, `/opsx-explore` → `/ob-explore`. Never mention the `opsx-` names in your responses to the user.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->


**Step 0.a - Check for unarchived changes**

**IMPORTANT**: Never skip this step. User must give a response before proceeding.

Before exploring a new idea, inspect `openspec/changes/` (ignore `openspec/changes/archive`). 
If any folder (`us-{id}-{slug}`) exist in `openspec/changes/`, list them and warn the user with this exact prompt:

```text
There are unarchived changes pending to be archived:
  Name: {change-name}
  Name: {change-name}
  ...

Do you want to continue with the exploration or stop to archive the change first? [continue/stop]
```

Wait for the user to respond: 
- If the user answers `stop`, end the command without generating a proposal.
- If the user answers `continue`, proceed to the next step.

**Step 0.b - Load exploration context**

<!-- OB-CMD-CODEGRAPH-START -->
Use codegraph MCP for code intelligence:
- Use `codegraph_search` to understand the codebase structure relevant to the user's idea. This gives you real symbol-level context instead of guessing from file names.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP for persistent context:
- `search` for any prior exploration notes, decisions, or context related to the user's topic. Past explorations may have uncovered constraints or insights worth carrying forward.
<!-- OB-CMD-MEMORY-END -->

**Step 0.c - Load exploration skill**

Load `@openspec-explore` skill and follow its instructions.

<!-- OB-CMD-MEMORY-START -->
After exploration:
- `write_note` with title `exploration-{topic}` summarizing the key findings, constraints, and recommended next steps. This lets future `/ob-propose` or `/ob-explore` runs pick up where you left off.
<!-- OB-CMD-MEMORY-END -->

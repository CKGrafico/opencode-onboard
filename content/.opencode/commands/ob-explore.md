---
description: Think through an idea, investigate a problem, or clarify requirements before creating a change.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->


**Step 0.a - Check for unarchived changes**

**IMPORTANT**: Never skip this step. User must give a response before proceeding.

Before exploring a new idea, inspect `openspec/changes/` (ignore `openspec/changes/archive`).
If any change folder exists in `openspec/changes/` (names vary by platform: `gh-*`, `us-*`, or a plain slug), list them and warn the user with this exact prompt:

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
Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash — use the MCP tools directly: `codegraph_search`, `codegraph_impact`, `codegraph_callers`, `codegraph_callees`, `codegraph_node`.
- `codegraph_search` to understand the codebase structure relevant to the user's idea.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP tools (NOT CLI commands). Do NOT run `basic-memory` in bash — use the MCP tools directly: `write_note`, `edit_note`, `search`, `build_context`, `recent_activity`.
- `search` for any prior exploration notes, decisions, or context related to the user's topic.
<!-- OB-CMD-MEMORY-END -->

**Step 0.c - Load exploration skill**

Load `@openspec-explore` skill and follow its instructions.

<!-- OB-CMD-MEMORY-START -->
After exploration:
- `write_note` with title `exploration-{topic}` summarizing the key findings, constraints, and recommended next steps.
<!-- OB-CMD-MEMORY-END -->

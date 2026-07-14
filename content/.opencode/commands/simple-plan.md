---
description: Quick plan — analyze the codebase and show a task checklist in the conversation. No files, no OpenSpec.
---

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

```
/simple-plan <feature description or task>
```

Lightweight planning for focused changes. Reads the codebase, shows a task checklist **in this conversation**, and stops. **No files are created.** This is a thinking tool, not a file writer.

**When to use this instead of `/explore-plan` → `/propose-plan`:**
- The task is clear and well-scoped (not a half-formed idea)
- You don't need to think through alternatives or investigate deeply
- You want a task list in under a minute, not a full proposal

---

**Step 1 — Understand the task**

Read the user's description. Use `glob` and `grep` to locate the relevant files, components, and patterns in the codebase. Read the key files to understand what exists and what needs to change.

<!-- OB-CMD-CODEGRAPH-START -->
Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash — use the MCP tools directly:
- `codegraph_search` to find relevant symbols, components, and file structure.
- `codegraph_impact` to understand dependencies between files.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
Use basic-memory MCP tools (NOT CLI commands). Do NOT run `basic-memory` in bash — use the MCP tools directly:
- `search` for any prior notes or decisions related to this area.
<!-- OB-CMD-MEMORY-END -->

**Step 2 — Show the plan**

Display the task checklist directly in the conversation:

```markdown
## Plan: <title>

### 1. <category name>
- [ ] 1.1 <specific task with file paths or areas>
- [ ] 1.2 <specific task>

### 2. <category name>
- [ ] 2.1 <specific task>
- [ ] 2.2 <specific task>
```

Rules:
- Each task is **concrete and actionable**
- Include **file paths or areas** in the task text when possible
- Order by logical dependency (dependencies first)

**Step 3 — Ask what's next**

Ask the user:

```text
What next? Options:
  /apply-plan  — implement these tasks now (creates a feature branch and works through them)
  /propose-plan — turn this into a full OpenSpec proposal with agent assignments
  (or just tell me to start on specific tasks)
```

Do NOT create any files. Do NOT run `/apply-plan` or `/propose-plan` automatically.

---
description: Quick plan — analyze the codebase and show a task checklist in the conversation. No files, no OpenSpec.
---

Lightweight planning for focused changes. Reads the codebase, shows a task checklist **in this conversation**, and stops. **No files are created.** This is a thinking tool, not a file writer.

**When to use this instead of `/plan-explore` → `/plan-propose`:**
- The task is clear and well-scoped (not a half-formed idea)
- You don't need to think through alternatives or investigate deeply
- You want a task list in under a minute, not a full proposal

---

**Step 1 — Understand the task**

Read the user's description. Use `glob` and `grep` to locate the relevant files, components, and patterns in the codebase. Read the key files to understand what exists and what needs to change.

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
  /plan-apply  — implement these tasks now (creates a feature branch and works through them)
  /plan-propose — turn this into a full OpenSpec proposal with agent assignments
  (or just tell me to start on specific tasks)
```

Do NOT create any files. Do NOT run `/plan-apply` or `/plan-propose` automatically.

---
description: Think through an idea, investigate a problem, or clarify requirements before creating a change.
---

> **HARD RULE: this command is read-only. Do NOT write, create, or modify any files.**
>
> You may read files, search code, and discuss. You must NOT:
> - Create or edit any source files, config files, or documentation.
> - Create or modify any OpenSpec artifacts (`openspec/changes/`, specs, tasks.md, proposal.md).
> - Run `git commit`, `git add`, or any file-writing shell command.
> - Run `/plan-apply`, `/plan-propose`, or any other command that writes files.
>
> The ONLY exception is agentmemory `memory_save` in Step 2, and ONLY if the user explicitly says `yes` when asked. Everything else is in-memory discussion only.

This command is **read-only**. It investigates, analyzes, and discusses: but never writes files unless you explicitly ask it to.

---

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

**Step 0.b - Load exploration skill**

Load `@openspec-explore` skill and follow its instructions.

**Step 1 - Discuss and analyze**

Work through the exploration with the user. Discuss findings, tradeoffs, constraints, and recommended next steps. This is a thinking conversation: no files are created.

**Step 2 - Offer to save (only if useful)**

After the exploration is complete, if the findings are significant and worth preserving, ask the user:

```text
Save this exploration to agentmemory for future reference? [yes/no]
```

- `yes` → `memory_save` with title `exploration-{topic}` summarizing the key findings, constraints, and recommended next steps.
- `no` → proceed to Step 3.

Do NOT write any files without this explicit ask.

**Step 3: Ask what's next**

Ask the user:

```text
What next? Options:
  /plan-propose: turn this into a full OpenSpec proposal with design, specs, and tasks
  /plan-quick  : lightweight task checklist (skip design/specs)
  /plan-apply  : dive straight into implementation (if the path is clear)
  (or just tell me to keep exploring)
```

Do NOT create any files. Do NOT run any of these commands automatically. The ONLY output of this command is the discussion and the optional agentmemory note (with explicit user consent).

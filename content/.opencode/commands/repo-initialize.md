---
description: Initialize the project. Presents a single form with all setup questions, then executes selected steps.
---

Check if `AGENTS.md` contains the `<!-- OB-NOT-INITIALIZED -->` marker.

- If no: tell the user the project is already initialized. Suggest running `/make-architecture` or `/make-design` if they want to refresh those docs.
- If yes: run the sequence below.

---

## Step 1, Ask everything at once

Use the **question** tool to present a multi-question form:

**Question 1** (single-select):
- Header: `"Type"`
- Question: `"What type of project is this?"`
- Options:
  - `brownfield`: Existing codebase. Generate docs from your code.
  - `greenfield`: Starting from scratch, little or no existing code.

**Question 2** (single-select):
- Header: `"History"`
- Question: `"Archive project history into OpenSpec?"`
- Options:
  - `Yes`: Scan codebase for existing docs, changelogs, decisions and archive them.
  - `No`: Skip history archival.

**Question 3** (single-select):
- Header: `"Architecture"`
- Question: `"Generate ARCHITECTURE.md from the codebase?"`
- Options:
  - `Yes`: Analyze project structure and generate architecture documentation.
  - `No`: Skip, leave as placeholder.

**Question 4** (single-select):
- Header: `"Design"`
- Question: `"Generate DESIGN.md from the design system?"`
- Options:
  - `Yes`: Analyze Tailwind, CSS vars, tokens and generate design documentation.
  - `No`: Skip, leave as placeholder.

Wait for ALL answers before proceeding.

---

## Step 2, Execute selected steps

Based on the user's answers, run the selected steps in order:

### Archive project history (if Yes)

Scan the codebase for existing documentation, changelogs, ADRs, README files, or notable history. Create an OpenSpec archive entry that captures this history.

Before scanning, load source roots from `.opencode/source-roots.json` when present. Only scan those roots plus this repo's docs/config files.

```bash
openspec new change "project-history"
```

Write a `proposal.md` inside that change summarizing:
- What this project is
- Key decisions already made (inferred from code and docs)
- Known tech debt or constraints visible in the codebase
- Current state of the project

Then archive it immediately:

```bash
openspec archive "project-history"
```

### Generate ARCHITECTURE.md (if Yes)

Run `/make-architecture` now. Follow every step defined in that command.

### Generate DESIGN.md (if Yes)

Run `/make-design` now. Follow every step defined in that command.

### Generate guardrails (always)

Run `/make-guardrails` now. Follow every step defined in that command.

---

## Step 3, Show help

Run `/repo-help` to display the full command reference.

---

## Step 4, Confirm

Tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Restart OpenCode now.
Nothing will work correctly until you do.
After restarting you are ready to work.
```

---

## Guardrails During Init

- Do NOT implement any features
- Do NOT create branches or PRs
- Do NOT modify any project source files
- Only read source files for analysis
- Write only to: ARCHITECTURE.md, DESIGN.md, AGENTS.md, openspec/, .agents/skills/

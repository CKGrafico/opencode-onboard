---
description: Initialize the project. Detects project type, then chains /make-architecture, /make-design, /make-guardrails, and /help.
---

Check if `AGENTS.md` contains the `<!-- OB-NOT-INITIALIZED -->` marker.

- If no: tell the user the project is already initialized. Suggest running `/make-architecture` or `/make-design` if they want to refresh those docs.
- If yes: run the sequence below.

---

## Step 1, Detect project type

Use the **AskUserQuestion tool** (not plain text) to present this choice:

- Question: `"Is this a greenfield or brownfield project?"`
- Options:
  - `greenfield` — Starting from scratch, little or no existing code. Skip architecture/design/history analysis.
  - `brownfield` — Existing codebase. Generate docs from your code.

Wait for the answer. Then follow the matching path below.

---

## Step 2, Archive project history (brownfield only)

Skip this step for greenfield projects.

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

---

## Step 3, Chain make commands

Run these commands in sequence. Each one handles its own analysis and file generation:

1. **`/make-architecture`** — generate `ARCHITECTURE.md`
2. **`/make-design`** — generate `DESIGN.md`
3. **`/make-guardrails`** — generate `project-guardrails` skill

For greenfield projects, tell the user: "Greenfield project detected — `/make-architecture` and `/make-design` will create placeholder files. Run them again once the codebase has meaningful content."

---

## Step 4, Show help

Run `/help` to display the full command reference.

---

## Step 5, Confirm

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

---
name: ob-repo-initialize
description: Initialize the project. Presents a single form with all setup questions, then executes selected steps. Invoked by the /repo-initialize command.
license: MIT
---
Check if `AGENTS.md` contains the `<!-- OB-NOT-INITIALIZED -->` marker.

- If no: tell the user the project is already initialized. Suggest running `/make-architecture` or `/make-design` if they want to refresh those docs.
- If yes: run the sequence below.

## Step 1: Ask everything at once

Use the question tool to present a multi-question form:

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

**Question 5** (single-select):
- Header: `"Evidence"`
- Question: `"Set up a visual-evidence harness for this project? (recommended for UI apps; /plan-goal uses it to prove changes work)"`
- Options:
  - `Yes`: I want deterministic screenshot/GIF evidence for pull requests. (Scaffolded after restart via `/make-evidence-scaffold`, not during init.)
  - `No`: Skip. You can run `/make-evidence-scaffold` any time later.

## Step 2: Execute selected steps

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

Then archive it immediately (`-y` skips the confirmation prompt so this never blocks):

```bash
openspec archive "project-history" -y
```

### Generate ARCHITECTURE.md (if Yes)

Load the `ob-make-architecture` skill now. Follow every step defined in it.

### Generate DESIGN.md (if Yes)

Load the `ob-make-design` skill now. Follow every step defined in it.

### Generate guardrails (always)

Load the `ob-make-guardrails` skill now. Follow every step defined in it.

### Visual evidence (if Yes)

Do not scaffold the harness during init. It writes `src/` source code, which is outside init's scope, and it needs the app to build under a restarted, fully-wired session. The completion message in Step 4 will instruct the user to run `/make-evidence-scaffold` after restarting.

## Step 3: Show help

Load the `ob-repo-help` skill and display the full command reference exactly as written.

## Step 4: Confirm

Tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Restart OpenCode now.
Nothing will work correctly until you do.
After restarting you are ready to work.
```

If the user answered Yes to Question 5 (Evidence), append this line to the message so the opted-in next step is not lost:

```
Next: run /make-evidence-scaffold to scaffold your visual-evidence harness.
```

## Init scope

During init, write only to: ARCHITECTURE.md, DESIGN.md, AGENTS.md, openspec/, .agents/skills/. Read source files for analysis. Feature implementation, branches, PRs, and project source file modification are outside init's scope.

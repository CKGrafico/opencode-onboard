---
description: Initialize the project. Runs the bootstrap sequence if not yet initialized. Supports both greenfield and brownfield projects.
---

Check if `AGENTS.md` contains the `<!-- OB-NOT-INITIALIZED -->` marker.

- If no: tell the user the project is already initialized. Suggest running `/ob-create-architecture` or `/ob-create-design` if they want to refresh those docs.
- If yes: run the full initialization sequence below.

---

## Initialization Sequence

### Step 1, Detect project type

Use the **AskUserQuestion tool** (not plain text) to present this choice:

- Question: `"Is this a greenfield or brownfield project?"`
- Options:
  - `greenfield` — Starting from scratch, little or no existing code. Skip architecture/design/history analysis.
  - `brownfield` — Existing codebase. Generate docs from your code.

Wait for the answer. Then follow the matching path below.

---

### Greenfield path

Skip steps 2, 3, and 4. Jump directly to Step 5.

Greenfield note: `ARCHITECTURE.md` and `DESIGN.md` are left as placeholders. Run `/ob-create-architecture` and `/ob-create-design` once the codebase has meaningful content.

---

### Brownfield path

#### Step 2, Archive project history into OpenSpec

Scan the codebase for any existing documentation, changelogs, ADRs, README files, or notable history that describes decisions already made in this project. Create an OpenSpec archive entry that captures this history so agents have context going forward.

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

#### Step 3, Generate ARCHITECTURE.md

Run `/ob-create-architecture` now. Follow every step defined in that command.

---

#### Step 4, Generate DESIGN.md

Run `/ob-create-design` now. Follow every step defined in that command.

---

### Step 5, Populate OpenSpec config

Write `openspec/config.yaml` with real project information. For greenfield projects, use what little is known (language choice, intended stack, domain). For brownfield, use what was discovered in steps 2–4.

The output must contain `schema: spec-driven` and a populated `context:` block. Do not leave placeholder text.

```yaml
schema: spec-driven

context: |
  Tech stack: <languages, frameworks, libraries found in the codebase>
  Build system: <build tools, package managers>
  Architecture: <monolith, microservices, monorepo, etc.>
  Conventions: <coding style, commit conventions, branching strategy if found>
  Domain: <what this project does, in one line>
```

Replace every `<…>` with real values. Add a `rules:` section only if the codebase has clear conventions worth enforcing. Do not invent rules that aren't evidenced by the codebase.

---

### Step 6, Install OpenCode plugins

OpenCode plugins declared in `.opencode/opencode.json` (under the `plugin` key) must be present in `.opencode/node_modules/` or OpenCode will fail to load them. The plugins are also listed in `.opencode/package.json` as dependencies.

```bash
cd .opencode
npm install
cd ..
```

This installs all plugin packages into `.opencode/node_modules/`. If you ever see "Plugin X not found" errors after init, run `npm install` in `.opencode/` again.

---

### Step 7, Remove the not-initialized marker

Remove the `<!-- OB-NOT-INITIALIZED -->` line from `AGENTS.md`. The file content otherwise stays unchanged — it was already the correct template.

Self-check after editing: the file must start with `# AGENTS.md`, must NOT contain `OB-NOT-INITIALIZED`, and must still contain `OB-RTK-START`. If any check fails, redo this step.

---

### Step 8, Confirm

For **brownfield**, tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ARCHITECTURE.md generated
- DESIGN.md generated
- openspec/config.yaml populated
- Project history archived in openspec
- OpenCode plugins installed
- AGENTS.md updated with real guidance

!! RESTART OPENCODE NOW !!

Quit and reopen OpenCode before doing anything else.
Nothing will work correctly until you do.
After restarting you are ready to work.
```

For **greenfield**, tell the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Initialization complete (greenfield).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- openspec/config.yaml populated
- OpenCode plugins installed
- AGENTS.md updated with real guidance
- ARCHITECTURE.md and DESIGN.md left as placeholders

Once your codebase has meaningful content, run:
  /ob-create-architecture   → generate architecture docs
  /ob-create-design         → generate design system docs

!! RESTART OPENCODE NOW !!

Quit and reopen OpenCode before doing anything else.
Nothing will work correctly until you do.
After restarting you are ready to work.
```

---

## Guardrails During Init

- Do NOT implement any features
- Do NOT create branches or PRs
- Do NOT modify any project source files
- Do NOT create CLI wrapper files or scripts
- Only read source files for analysis, write only to ARCHITECTURE.md, DESIGN.md, AGENTS.md, openspec/config.yaml, and openspec/
- `npm install` (step 6) is allowed to modify `.opencode/package-lock.json` and `.opencode/node_modules/`

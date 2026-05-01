# AGENTS.md, Bootstrap Mode

> This project has not been initialized yet.
> Your ONLY job right now is to run the initialization sequence below.
> Do not do anything else until all steps are complete.

## Trigger

When the user says anything resembling initialization, "init", "initialize", "setup", "start", "bootstrap", "get started", "prepare", execute all steps below in order. Do not ask for confirmation before starting.

---

## Initialization Sequence

### Step 1, Archive project history into OpenSpec

Scan the codebase for any existing documentation, changelogs, ADRs, README files, or notable history that describes decisions already made in this project. Create an OpenSpec archive entry that captures this history so agents have context going forward.

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

### Step 2, Generate DESIGN.md

Read the current contents of `DESIGN.md`. It contains a prompt/command. Do the following:

1. Copy the prompt text from `DESIGN.md` into memory
2. Wipe `DESIGN.md` completely (write empty file)
3. Execute the copied prompt against this codebase, analyze the design system, visual tokens, typography, colors, spacing, and UI patterns
4. Write the result back into `DESIGN.md` following the format described in the prompt

The output must be a real, populated `DESIGN.md`, not the prompt itself.

---

### Step 3, Generate ARCHITECTURE.md

Read the current contents of `ARCHITECTURE.md`. It contains a prompt/command. Do the following:

1. Copy the prompt text from `ARCHITECTURE.md` into memory
2. Wipe `ARCHITECTURE.md` completely (write empty file)
3. Execute the copied prompt against this codebase, analyze the full architecture, structure, components, data flows, integrations, and tech stack
4. Write the result back into `ARCHITECTURE.md` following the structure described in the prompt

The output must be a real, populated `ARCHITECTURE.md` covering all sections the prompt describes, not the prompt itself.

---

### Step 4, Rewrite this file

Replace the entire contents of `AGENTS.md` with the real agent guidance template located at `.agents/agents/.bootstrap/AGENTS.template.md`.

---

### Step 5, Confirm

Tell the user:

```
Initialization complete.

- ARCHITECTURE.md generated
- DESIGN.md generated
- Project history archived in openspec
- AGENTS.md updated with real guidance

You're ready to work.
```

---

## Guardrails During Init

- Do NOT implement any features
- Do NOT create branches or PRs
- Do NOT modify any project source files
- Only read source files for analysis, write only to ARCHITECTURE.md, DESIGN.md, AGENTS.md, and openspec/

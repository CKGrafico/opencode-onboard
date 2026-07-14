---
description: Create a custom engineer agent via persona-driven interactive design
---

Create a custom engineer agent using a **persona-driven** approach. Ask simple choice/yes-no questions — never ask the user to type free text. Context comes from analyzing source roots, not from user descriptions.

**Usage**: `/make-engineer`

---

## Step 1 — Ask persona (always, closed choice)

Ask the user this question using the `question` tool:

> **"What type of engineer are you creating?"**
>
> - **Frontend** — UI components, pages, mobile, styling, browser
> - **Layout Designer** — Design systems, CSS architecture, Storybook, a11y
> - **Backend** — APIs, databases, auth, services
> - **DevOps** — CI/CD, infra, Docker, deploy

The chosen persona determines everything: what to detect, what questions to ask, what skills to suggest.

---

## Step 2 — Detect signals from source roots

Read `.opencode/source-roots.json` for the roots to scan. Only analyze those directories.

Scan for **persona-relevant** signals only. Look in manifest files (`package.json`, `tsconfig.json`, `*.csproj`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, etc.) and project structure:

- **Framework** — web, backend, or mobile framework
- **Data layer** — ORM, database client, cache client
- **Testing** — test framework, test config files, test directories
- **Styling** — CSS framework, CSS-in-JS, design tokens
- **Architecture** — FSD, monolith, microservices, feature dirs
- **i18n** — internationalization libs
- **CI/CD** — workflow definition files
- **Cloud / IaC** — cloud provider config, infrastructure-as-code files
- **Monitoring** — observability/monitoring config or deps

Report what was detected:

```
Detected:
  ✓ <signal> (<source>)
  ✓ <signal> (<source>)
  ...
```

---

## Step 3 — Ask persona-specific questions (dynamic, 2-4 questions)

Based on the detected signals, ask 2-4 relevant questions using the `question` tool. Each question is a simple closed choice or yes-no.

- Only ask about things where multiple options were detected or where the user's choice matters
- Skip anything where only one option was detected — just use it
- Don't ask more than 4 questions

---

## Step 4 — Install selected skills

Use the `@find-skills` skill workflow to discover and install relevant skills for the detected stack. Check `skills-lock.json` to see what's already installed before installing duplicates.

Install each skill:
```bash
npx skills add <owner/repo>
```

---

## Step 5 — Generate the engineer file

Create `.opencode/agents/{persona}-engineer.md` with this structure:

```markdown
---
description: <derived from persona + detected signals, one sentence>
mode: all
color: <pick: primary|secondary|accent|warning|error|info — avoid colors used by existing agents>
permission:
  edit: allow
  bash: allow
  read: allow
  glob: allow
  grep: allow
---

## Abilities
- Guardrails: @ob-generic-guardrails
- Development: <@installed-skill-1>, <@installed-skill-2>, ...
- Testing: <@installed-skill-for-testing>, ...
- Infrastructure: <@installed-skill-for-devops>, ...
```

Rules for the generated file:
- **No `model:` field** — the `ob-subagent-tiers` plugin injects tier variants at startup
- **No `## Workflow` section** — the engineer workflow is defined once in `@ob-generic-guardrails`
- Only include ability categories that have at least one real skill (besides Guardrails which is always present)
- **Development** = language/framework/UI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps/CI/CD/cloud skills
- Name follows `{persona}-engineer` pattern (e.g. `frontend-engineer`, `backend-engineer`)
- Read existing agents' `color:` frontmatter first — pick a color not already used

---

## Step 6 — Update fullstack-engineer.md abilities

The `fullstack-engineer.md` must have **ALL** installed skills. After creating the persona engineer:

1. Read `.agents/skills/` directory to list all installed skills
2. Read `skills-lock.json` for npx-installed skills
3. Read the current `fullstack-engineer.md`
4. Regenerate its `## Abilities` section to include every installed skill
5. Preserve the frontmatter (mode, color, permissions, model if stamped)
6. Write the file back

The fullstack engineer is the fallback that can do anything — it always has every skill.

---

## Step 7 — Update AGENTS.md

Add the new agent to the agents table in AGENTS.md (if a table exists) or note it:
```
| `{persona}-engineer` | .opencode/agents/{persona}-engineer.md | <short role description> |
```

---

## Step 8 — Show summary

Report:
- Engineer file created at `.opencode/agents/{persona}-engineer.md`
- Skills installed (list each with source)
- `fullstack-engineer.md` updated with all skills
- How to use: "This agent will be spawned by the lead during `/plan-apply` for tasks matching its specialty."
- "Restart opencode for the `ob-subagent-tiers` plugin to pick up the new engineer."

**Guidelines**
- Always keep `@ob-generic-guardrails` in the Guardrails ability
- NEVER use `@ob-default` in any ability category — all abilities must reference real installed skills
- One file per engineer — do NOT create `-build`/`-fast` variant files. The `ob-subagent-tiers` plugin injects tier variants at startup
- Skills should match both the persona AND the project's tech stack
- If `npx skills` CLI is not available, manually reference skills by their `owner/repo` name and tell the user to install them

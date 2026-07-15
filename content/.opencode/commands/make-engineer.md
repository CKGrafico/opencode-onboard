---
description: Create a custom engineer agent via persona-driven interactive design
---

Create a custom engineer agent using a **persona-driven** approach. Ask simple choice/yes-no questions: never ask the user to type free text. Context comes from analyzing source roots, not from user descriptions.

**Usage**: `/make-engineer`

---

## Step 1: Ask persona (always, closed choice)

Ask the user this question using the `question` tool:

> **"What type of engineer are you creating?"**
>
> - **Frontend**: UI components, pages, mobile, styling, browser
> - **Layout Designer**: Design systems, CSS architecture, Storybook, a11y
> - **Backend**: APIs, databases, auth, services
> - **Data**: Data pipelines, ETL, analytics, ML models, data quality
> - **DevOps**: CI/CD, infra, Docker, deploy
> - **Security**: Auth, secrets, vulnerability scanning, hardening
> - **Mobile**: React Native, Flutter, native iOS/Android
> - **API / Integration**: REST/GraphQL APIs, webhooks, third-party integrations
> - **QA**: Test automation, E2E, regression, performance testing

The chosen persona determines everything: what to detect, what questions to ask, what skills to suggest.

If the user selects "Type your own answer", accept any single-word persona name and proceed with the same flow.

---

## Step 2: Detect signals from source roots

**Check `source-roots.json` first.** Read `.opencode/source-roots.json`. If it doesn't exist or has empty roots, ask the user which directories to scan using the `question` tool with the project's top-level directories as options.

Scan for **persona-relevant** signals only. Look in manifest files (`package.json`, `tsconfig.json`, `*.csproj`, `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, etc.) and project structure:

- **Language**: primary language(s) and version(s)
- **Framework**: web, backend, or mobile framework
- **Data layer**: ORM, database client, cache client
- **Testing**: test framework, test config files, test directories
- **Styling**: CSS framework, CSS-in-JS, design tokens
- **Architecture**: FSD, monolith, microservices, feature dirs
- **i18n**: internationalization libs
- **CI/CD**: workflow definition files
- **Cloud / IaC**: cloud provider config, infrastructure-as-code files
- **Monitoring**: observability/monitoring config or deps
- **Linting**: linter, formatter, and their config files
- **Dependency Injection**: DI/IoC containers, hook frameworks

Report what was detected as a **signal inventory** — this list drives Step 4 deterministically:

```
Signal inventory:
  ✓ <signal-type>: <signal-value> (<source>)
  ✓ <signal-type>: <signal-value> (<source>)
  ...
```

---

## Step 3: Ask persona-specific questions (dynamic, 2-4 questions)

Based on the detected signals, ask 2-4 relevant questions using the `question` tool. Each question is a simple closed choice or yes-no.

- Only ask about things where multiple options were detected or where the user's choice matters
- Skip anything where only one option was detected: just use it
- Don't ask more than 4 questions

---

## Step 4: Deterministic skill discovery

This step is the core of the engineer's value. Follow every sub-step. Do NOT skip searches, do NOT fall back to personal/global skills, do NOT use fewer than 5 skills.

### 4a. Pre-check already-installed skills

Before searching, build a map of what's already available:

1. List every directory in `.agents/skills/`
2. Read `skills-lock.json` for npx-installed skills
3. For each detected signal from Step 2, check if an already-installed skill covers it
4. Mark covered signals as **already-satisfied** — they won't be searched again

Report:
```
Already installed:
  ✓ <skill-name> covers <signal>
  ...
Signals still needing skills:
  - <signal-type>: <signal-value>
  ...
```

### 4b. Ensure `find-skills` is available

Check if `.agents/skills/find-skills/SKILL.md` exists. If not, install it:

```bash
npx skills add vercel-labs/skills@find-skills
```

This is a **hard prerequisite**. If it can't be installed, stop and tell the user: "find-skills is required for skill discovery. Install it manually with `npx skills add vercel-labs/skills@find-skills` and re-run."

### 4c. Signal-to-query mapping (deterministic, no skipping)

For each **uncovered** signal from 4a, run a mandatory `npx skills find` with a specific query. Use this explicit mapping table:

| Signal type | Search query |
|---|---|
| Language | `npx skills find "<language-name>"` (e.g. `typescript`, `csharp`, `python`) |
| Framework | `npx skills find "<framework-name>"` (e.g. `react`, `ink`, `angular`, `django`) |
| Architecture | `npx skills find "<pattern-name>"` (e.g. `feature sliced design`, `microservices`) |
| Testing | `npx skills find "<test-framework> testing"` (e.g. `vitest testing`, `jest testing`) |
| Styling | `npx skills find "<css-framework>"` (e.g. `tailwind`, `css modules`, `design tokens`) |
| Linting | `npx skills find "eslint prettier"` or `"lint format"` |
| CI/CD | `npx skills find "ci cd pipeline"` or `"<platform> actions"` |
| Cloud / IaC | `npx skills find "<cloud-provider> infrastructure"` (e.g. `azure infrastructure`) |
| Monitoring | `npx skills find "observability monitoring"` |
| i18n | `npx skills find "i18n internationalization"` |
| Data layer | `npx skills find "<orm-or-db> orm"` (e.g. `entity framework orm`, `prisma orm`) |
| Dependency Injection | `npx skills find "<di-framework>"` (e.g. `inversify`, `autofac`) |

**Every uncovered signal gets its own search. No signal is skipped.** Capture the output of each search.

If a signal doesn't fit any table row, derive a query from the signal value itself: `npx skills find "<signal-value>"`.

### 4d. Quality filter (structured, not vibes)

From each search result, select the best candidate using these rules in order:

1. **Install count ≥ 100** — skip anything below. Prefer ≥ 1000.
2. **Official/canonical source** — prefer `vercel-labs`, `anthropics`, `microsoft`, `feature-sliced`, `wshobson`, `github` over unknown authors.
3. **Topical match** — the skill description must clearly match the signal. A React skill with 500K installs doesn't cover TypeScript if its description is only about React components.
4. If the top result is < 100 installs → record "no quality skill found on skills.sh for \<signal\>" and move on.

### 4e. Coverage requirement: 5-10 skills

- **Minimum = number of detected persona-relevant signals** (if 6 signals detected, need ≥ 6 skills — one per signal minimum)
- **Ideal range: 5-8** for most engineers
- **Hard cap: 10** — if more candidates found, rank by install count + source reputation and keep the top 10
- **No redundant skills** — if an already-selected skill covers the same scope as a new candidate (e.g. `vercel-react-best-practices` already covers TypeScript basics), skip the new candidate unless it provides genuinely deeper coverage for a different concern (e.g. `typescript-advanced-types` is deeper than React general guidance, so both are fine)
- If fewer than 5 skills are found after all searches → tell the user how many were found and ask whether to proceed with fewer or cancel

### 4f. Install selected skills

Install each selected skill using explicit `@skill-name` syntax (project-local, never global):

```bash
npx skills add <owner/repo@skill-name>
```

Do NOT use the `-g` flag — skills must be project-local so they land in `.agents/skills/` and are tracked in `skills-lock.json`.

### 4g. Post-install verification

After each `npx skills add`, verify the skill actually landed:

1. Check `.agents/skills/<skill-name>/SKILL.md` exists
2. Check `skills-lock.json` now contains the skill entry

If either check fails (network glitch, wrong repo name, auth issue):
- Retry the install once
- If still failing, drop the skill from the selection and note it in the summary as "install failed"

### 4h. Reject global/personal skills

Skills from `~/.claude/skills/` or `~/.agents/skills/` (visible in the system prompt as available skills) must **NEVER** be referenced in the agent file. Only skills installed in the project's `.agents/skills/` directory are allowed.

If you are tempted to reference a skill because it appears in the session's available skills list but is NOT in `.agents/skills/`, stop — run `npx skills find` to find a project-local equivalent and install it instead.

---

## Step 5: Generate the engineer file

### 5a. Idempotency check

Before creating the file, check if `.opencode/agents/{persona}-engineer.md` already exists. If it does:
- Ask the user: "An engineer named `{persona}-engineer` already exists. Overwrite or cancel?"
- If overwrite: proceed, but preserve the existing `color:` frontmatter value unless the user chose a new one
- If cancel: stop

### 5b. Generate the file

Create `.opencode/agents/{persona}-engineer.md` with this structure:

```markdown
---
description: <one sentence naming the persona + top 3-5 detected technologies>
mode: all
color: <pick: primary|secondary|accent|warning|error|info: avoid colors used by existing agents>
permission:
  edit: allow
  bash: allow
  read: allow
  glob: allow
  grep: allow
---

## Abilities
- Guardrails: @ob-guardrails-generic, @ob-guardrails-project
- Development: <@installed-skill-1>, <@installed-skill-2>, ...
- Testing: <@installed-skill-for-testing>, ...
- Infrastructure: <@installed-skill-for-devops>, ...
```

### 5c. Description quality bar

The `description:` field is the **matching key** for `/ob-apply` — the lead compares task domain text against agent descriptions to pick the right specialist. A weak description means the wrong engineer gets spawned.

**Bad:** `"A frontend engineer for React"`
**Good:** `"Frontend engineer for Ink 7 + React 19 TUI, FSD architecture, Inversify DI, design tokens, and i18n"`

Rules:
- Name the persona explicitly
- List the top 3-5 detected technologies from Step 2
- One sentence, no padding

### 5d. Category rules

Rules for the generated file:
- **No `model:` field**: the `ob-subagent-tiers` plugin injects tier variants at startup
- **No `## Workflow` section**: the engineer workflow is defined once in `@ob-guardrails-generic`
- Only include ability categories that have at least one real skill (besides Guardrails which is always present)
- **Development** = language/framework/UI/DI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps/CI/CD/cloud skills
- Name follows `{persona}-engineer` pattern (e.g. `frontend-engineer`, `backend-engineer`)
- Read existing agents' `color:` frontmatter first: pick a color not already used

---

## Step 6: Validate skill references

After writing the agent file, validate every `@skill-name` reference in its `## Abilities` section:

1. Parse every `@skill-name` from the file (excluding `@ob-guardrails-generic` and `@ob-guardrails-project` which are installed at init)
2. For each: check `.agents/skills/<skill-name>/SKILL.md` exists
3. For each: check `skills-lock.json` contains the skill
4. If any reference is missing:
   - Try to install it: `npx skills add <owner/repo@skill-name>` (search `skills-lock.json` or `npx skills find` for the owner/repo)
   - If install fails or the skill can't be found on skills.sh → **remove the reference from the file**, warn the user, and note it in the summary
5. Re-read the file to confirm all remaining `@skill-name` references are valid

This prevents broken agents that reference skills which don't exist in the project.

---

## Step 7: Update fullstack-engineer.md abilities

The `fullstack-engineer.md` is `mode: primary` — it's the planning session agent, not a spawned worker. Having all skills here is fine since it does planning, not parallel implementation.

After creating the persona engineer and validating its references (Step 6), **additively merge** new skills into fullstack:

1. Read `.agents/skills/` directory to list all installed skills
2. Read `skills-lock.json` for npx-installed skills
3. Read the current `fullstack-engineer.md`
4. Parse its existing `## Abilities` section to find which skills are already listed
5. **Append-only**: add only skills that are not already in the file (dedup by skill name)
6. Preserve the frontmatter (mode, color, permissions, model if stamped) and all existing ability lines
7. Write the file back

**Do NOT overwrite the Abilities section** — merge new skills into existing categories. If a new skill belongs to "Development" and that line already exists, append to it. If a new category is needed, add it.

---

## Step 8: Update AGENTS.md

Add the new agent to the agents table in AGENTS.md (if a table exists) or note it:
```
| `{persona}-engineer` | .opencode/agents/{persona}-engineer.md | <short role description> |
```

---

## Step 9: Show summary

Report:
- Engineer file created at `.opencode/agents/{persona}-engineer.md`
- Skills installed from skills.sh (list each with source + install count)
- Signals with no quality skill found on skills.sh (list each)
- Skills that failed validation or install (list each with reason)
- `fullstack-engineer.md` updated (additive — list new skills added)
- How to use: "This agent will be spawned by the lead during `/plan-apply` for tasks matching its specialty."
- "Restart opencode for the `ob-subagent-tiers` plugin to pick up the new engineer."

---

**Guidelines**

- Always keep `@ob-guardrails-generic` in the Guardrails ability
- `@ob-guardrails-project` should also be present when the project has generated a project-guardrails skill
- NEVER use `@ob-default` in any ability category: all abilities must reference real installed skills
- One file per engineer: do NOT create `-build`/`-fast` variant files. The `ob-subagent-tiers` plugin injects tier variants at startup

**Skill discovery rules:**
- Run `npx skills find` for **every** detected signal — no skipping
- Every `@skill-name` in the agent file MUST exist in `.agents/skills/` — never reference global or personal skills from `~/.claude/skills/` or `~/.agents/skills/`
- Prefer skills with ≥ 1000 installs and official/canonical sources (`vercel-labs`, `anthropics`, `microsoft`, `feature-sliced`, `wshobson`, `github`)
- Minimum 5 skills per engineer, ideal 5-8, hard cap at 10
- No redundant skills — skip a candidate if an already-selected skill covers the same scope
- Use `npx skills add <owner/repo@skill-name>` (project-local, no `-g` flag)
- Verify each install landed in `.agents/skills/` and `skills-lock.json` before referencing it

**Idempotency / re-run safety:**
- Before creating the agent file: check if `{persona}-engineer.md` already exists — ask "overwrite or cancel?"
- Fullstack update is **additive**: merge new skills, never overwrite the existing Abilities section
- Before searching skills.sh, check `.agents/skills/` and `skills-lock.json` for already-installed skills that cover a signal — don't re-install what you have

**Description quality:**
- The agent `description:` must name the persona + top 3-5 detected technologies — it's the matching key for `/ob-apply`

**If `npx skills` CLI is not available:**
- Manually reference skills by their `owner/repo` name in the abilities section and tell the user to install them
- Still validate that each referenced skill exists in `.agents/skills/` — if not, remove it and warn the user

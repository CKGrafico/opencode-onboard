---
description: Create a custom engineer agent via persona-driven interactive design
---

## CRITICAL RULES — READ BEFORE DOING ANYTHING

1. **ONE file only**: `.opencode/agents/{persona}-engineer.md`. NEVER create `.build.md`, `.fast.md`, `.plan.md`, or any variant file. The `ob-subagent-tiers` plugin creates those at startup.
2. **File content = template only**: YAML frontmatter + one identity paragraph (2-3 sentences) + `## Abilities` section. No other `##` headings. No expertise notes. No architecture details. No conventions. No file maps. No workflow steps. Those belong in skills, not the agent file.
3. **NEVER write `model:`** in the agent file. The `ob-subagent-tiers` plugin injects it.
4. **ALWAYS `mode: primary`** for template files — the `ob-subagent-tiers` plugin creates variants with `mode: subagent` at startup.
5. **Skills FIRST**: You MUST complete Step 4 (run `npx skills find` for every detected signal, install 5-10 skills from skills.sh) BEFORE writing any file. If you have not run `npx skills find` at least once, you are not ready to write the file.
6. **No global skills**: Only skills installed in the project's `.agents/skills/` directory can be referenced. Skills from `~/.claude/skills/` or `~/.agents/skills/` are FORBIDDEN.
7. **No `@ob-default`** in any ability category — all abilities must reference real installed skills.

If the finished file has any `##` heading other than `## Abilities`, or has a `model:` field, or has `mode: subagent`, or is missing skills from `.agents/skills/` — you have failed. Rewrite it.

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

If the user passes the persona as an argument (e.g. `/make-engineer frontend`) or selects "Type your own answer", accept any single-word persona name and skip to Step 2.

---

## Step 2: Detect signals from source roots

**Check `source-roots.json` first.** Read `.opencode/source-roots.json`. If it doesn't exist or has empty roots, ask the user which directories to scan using the `question` tool with the project's top-level directories as options.

Also read `ARCHITECTURE.md` and `DESIGN.md` for context on the tech stack.

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

### STOP — DO NOT WRITE ANY FILE YET

You must complete this step fully before writing anything in Step 5. The agent file is worthless without real skills from skills.sh. If you skip this step, the engineer will have no abilities and will fail at every task.

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

### 4h. GATE — Verify you are ready to write the file

Before proceeding to Step 5, answer these questions. If any answer is "no", you are NOT ready.

1. Did you run `npx skills find` for every uncovered signal? (yes/no)
2. Did you install at least 5 skills from skills.sh into `.agents/skills/`? (yes/no)
3. Did you verify each installed skill exists in `.agents/skills/<name>/SKILL.md`? (yes/no)
4. Are you about to write ONE file only (no `.build.md` variant)? (yes/no)

If any answer is "no", go back and fix it. Do not proceed to Step 5.

---

## Step 5: Fill the template

All the research from Steps 2-4 (signal detection, project analysis, tech stack knowledge) was for **selecting the right skills**. The agent file itself is **just the template below — nothing else**. Do NOT write project knowledge, architecture notes, coding conventions, file maps, testing patterns, or workflow instructions into the file. Those belong in skills and guardrails, not in the agent file.

### 5a. Idempotency check

Before creating the file, check if `.opencode/agents/{persona}-engineer.md` already exists. If it does:
- Ask the user: "An engineer named `{persona}-engineer` already exists. Overwrite or cancel?"
- If overwrite: proceed, but preserve the existing `color:` frontmatter value unless the user chose a new one
- If cancel: stop

### 5b. Fill the template

The agent file is **exactly** this structure — frontmatter + one identity paragraph + `## Abilities` section. No other sections. No other content.

```markdown
---
description: <one sentence naming the persona + top 3-5 detected technologies>
mode: primary
color: <pick: primary|secondary|accent|warning|error|info: avoid colors used by existing agents>
permission:
  edit: allow
  bash: allow
  read: allow
  glob: allow
  grep: allow
---

<One paragraph: "You are a {persona} engineer specializing in {top technologies}. You own all work in {scope/files}." Keep it to 2-3 sentences max.>

## Abilities
- Guardrails: @ob-guardrails-generic, @ob-guardrails-project
- Development: <@installed-skill-1>, <@installed-skill-2>, ...
- Testing: <@installed-skill-for-testing>, ...
- Infrastructure: <@installed-skill-for-devops>, ...
```

That is the **entire file**: frontmatter, one identity paragraph, and the `## Abilities` section. Replace every `<...>` placeholder with real values from your research. Remove any ability category line that has no skills assigned (besides Guardrails which is always present).

### 5c. Description quality bar

The `description:` field is the **matching key** for `/plan-apply` — the lead compares task domain text against agent descriptions to pick the right specialist. A weak description means the wrong engineer gets spawned.

**Bad:** `"A frontend engineer for React"`
**Good:** `"Frontend engineer for Ink 7 + React 19 TUI, FSD architecture, Inversify DI, design tokens, and i18n"`

Rules:
- Name the persona explicitly
- List the top 3-5 detected technologies from Step 2
- One sentence, no padding

### 5d. Identity paragraph

The identity paragraph sits between frontmatter and `## Abilities`. It tells the engineer who it is and what it owns in **2-3 sentences max**. Not a spec, not a knowledge dump — a quick scoping statement.

**Bad:** 5 paragraphs of architecture details, FSD rules, design tokens, file maps, testing patterns...
**Good:** `"You are a frontend engineer specializing in terminal UI development with Ink 7 + React 19. You own all work in the FSD layers: src/app/, src/widgets/, src/features/, src/entities/, and src/shared/."`

Rules:
- State the persona + specialization in one sentence
- State what files/layers the engineer owns in one sentence
- Never exceed 3 sentences

### 5e. Category rules

- **Development** = language/framework/UI/DI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps/CI/CD/cloud skills
- Only include ability categories that have at least one real skill (besides Guardrails which is always present)
- Name follows `{persona}-engineer` pattern (e.g. `frontend-engineer`, `backend-engineer`)
- Read existing agents' `color:` frontmatter first: pick a color not already used

### 5f. FORBIDDEN content

The following MUST NOT appear in the agent file. If you are about to write any of these, STOP — you are doing it wrong:

- **No `model:` field** — the `ob-subagent-tiers` plugin injects tier variants at startup
- **No `## Workflow` or `## When Spawned` section** — the engineer workflow is defined once in `@ob-guardrails-generic`, every engineer loads it via its Guardrails ability
- **No `## Core Expertise` or `## Key Patterns` section** — project knowledge lives in skills and `@ob-guardrails-project`, not in the agent file
- **No `## Testing` or `## Conventions` section** — these belong in skills
- **No `## File Responsibilities` or file maps** — the engineer discovers files at spawn time via codegraph and grep
- **No `## Domain Expertise` or `## FSD Layer Rules` or `## Project Patterns` section**
- **No `## Gate Order` or `## i18n` or `## What You Do NOT Touch` section**
- **No free-text paragraphs beyond the identity paragraph** — the file is frontmatter + one identity paragraph + categorized abilities, period
- **No `mode: subagent` or `mode: all`** — persona engineer templates are always `mode: primary`; the `ob-subagent-tiers` plugin creates `mode: subagent` variants at startup
- **No custom `bash:` permission Allowlist** — use `bash: allow`, not a per-command Allowlist

The ONLY permitted content in the file body (after frontmatter) is: one identity paragraph (2-3 sentences) + `## Abilities` section. If the finished file has any `##` heading other than `## Abilities`, or has more than one paragraph before `## Abilities`, **you have failed**. Rewrite it.

---

## Step 6: Validate the file

After writing the agent file, run **both** checks below. If either fails, fix the file and re-validate.

### 6a. Structural validation

Re-read the file you just wrote and verify:

1. **Frontmatter exists** — starts with `---`, has `description`, `mode: primary`, `color`, `permission` block
2. **No `model:` field** in the frontmatter
3. **`## Abilities` is the ONLY `##` heading** — no other `##` sections exist in the file
4. **One identity paragraph** before `## Abilities` — 2-3 sentences max, not multiple paragraphs
5. **Abilities are categorized** — each line starts with `- Guardrails:`, `- Development:`, `- Testing:`, or `- Infrastructure:`. No bare `@skill-name` lines.
6. **No forbidden content** — no expertise notes, no workflow steps, no file maps, no conventions, no extra sections
7. **One file only** — no `.build.md`, `.fast.md`, or `.plan.md` variant was created

If ANY check fails: rewrite the file to match the template exactly. Do not proceed with a broken file.

### 6b. Skill reference validation

1. Parse every `@skill-name` from the `## Abilities` section (excluding `@ob-guardrails-generic` and `@ob-guardrails-project` which are installed at init)
2. For each: check `.agents/skills/<skill-name>/SKILL.md` exists
3. For each: check `skills-lock.json` contains the skill
4. If any reference is missing:
   - Try to install it: `npx skills add <owner/repo@skill-name>` (search `skills-lock.json` or `npx skills find` for the owner/repo)
   - If install fails or the skill can't be found on skills.sh → **remove the reference from the file**, warn the user, and note it in the summary
5. Re-read the file to confirm all remaining `@skill-name` references are valid

---

## Step 7: Update fullstack-engineer.md abilities

The `fullstack-engineer.md` is `mode: primary` — it's the planning session agent, not a spawned worker. Having all skills here is fine since it does planning, not parallel implementation. Its file follows the same template: frontmatter + identity paragraph + `## Abilities`, nothing else.

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

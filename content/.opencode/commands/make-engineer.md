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

Scan for **persona-relevant** signals only:

### Frontend signals
- `package.json` deps: `react`, `vue`, `@angular/core`, `svelte`, `next`, `react-native`, `expo`
- Config: `tsconfig.json`, `vite.config.*`, `next.config.*`, `angular.json`
- Dirs: `src/features/`, `src/widgets/`, `src/pages/`, `src/shared/`, `app/`
- Testing: `vitest.config.*`, `jest.config.*`, `cypress/`, `playwright.config.*`
- State: `zustand`, `redux`, `jotai`, `mobx`, `pinia`, `vuex` in deps
- i18n: `next-intl`, `react-intl`, `i18next` in deps
- Styling: `tailwindcss`, `@emotion/react`, `styled-components`, `css-modules` in deps or config

### Layout Designer signals
- `storybook` in deps or `.storybook/` dir
- `tailwindcss`, `@emotion/react`, `styled-components` in deps
- Design tokens: `src/tokens/`, `src/styles/tokens.*`, `design-tokens.*`
- Component lib structure: `src/components/`, `src/ui/`, `src/lib/`

### Backend signals
- `*.csproj` → .NET (check `PackageReference` for `Microsoft.EntityFrameworkCore`, `xunit`, `nunit`)
- `package.json` deps: `express`, `fastify`, `nestjs`, `@prisma/client`, `mongoose`, `pg`, `redis`
- `pyproject.toml` / `requirements.txt`: `django`, `flask`, `fastapi`, `sqlalchemy`, `pytest`
- `go.mod`: `gin`, `echo`, `gorm`
- Auth: `jsonwebtoken`, `passport`, `@azure/msal-node`, `Auth0` in deps

### DevOps signals
- `Dockerfile`, `docker-compose.yml`, `docker-compose.yaml`
- `k8s/` dir, `*.yaml` with `apiVersion:` (Kubernetes)
- `terraform/` dir, `*.tf` files
- `*.bicep` files
- `.github/workflows/`, `azure-pipelines.yml`, `.gitlab-ci.yml`
- `prometheus`, `grafana`, `datadog` in config

Report what was detected to the user before proceeding:

```
Detected:
  ✓ React 18 (package.json)
  ✓ Feature-Sliced Design (src/features/, src/widgets/)
  ✓ Vitest (vitest.config.ts)
  ✓ Tailwind CSS (tailwind.config.ts)
  ✓ next-intl (i18n)
```

---

## Step 3 — Ask persona-specific questions (dynamic, 2-4 questions)

Ask ONLY questions relevant to the persona and detected signals. Each question is a simple choice or yes-no. Use the `question` tool for each.

### Frontend branch

Q: **"Which framework?"**
- React (detected)
- Vue
- Angular
- Svelte
- None

If React selected and hooks-only (no class components detected):

Q: **"Use React concurrent features (transitions, deferred values)?"**
- Yes
- No

Q: **"Testing framework?"** (skip if none detected)
- Vitest (detected)
- Jest
- Cypress
- Playwright
- None

Q: **"State management approach?"** (skip if none detected)
- Zustand (detected)
- Redux
- Jotai
- None

### Layout Designer branch

Q: **"CSS approach?"**
- Tailwind (detected)
- CSS Modules
- Emotion
- Styled Components
- Plain CSS

Q: **"Use Storybook?"** (skip if not detected)
- Yes
- No

Q: **"Accessibility level?"**
- WCAG AA (recommended)
- WCAG AAA
- Basic only

### Backend branch

Q: **"Primary language?"**
- C# / .NET (detected)
- TypeScript / Node.js (detected)
- Python (detected)
- Go (detected)
- Other

If C# detected:

Q: **"ORM?"**
- Entity Framework Core (detected)
- Dapper
- None

Q: **"API style?"**
- REST
- GraphQL
- gRPC
- Minimal APIs
- Controllers

Q: **"Testing framework?"** (skip if none detected)
- xUnit (detected)
- NUnit
- MSTest
- None

### DevOps branch

Q: **"Cloud provider?"**
- Azure (detected)
- AWS
- GCP
- Self-hosted

Q: **"Infrastructure as Code tool?"** (skip if none detected)
- Terraform (detected)
- Bicep (detected)
- Pulumi
- None

Q: **"CI platform?"**
- GitHub Actions (detected)
- Azure DevOps (detected)
- GitLab CI (detected)
- None

Q: **"Monitoring?"** (skip if none detected)
- Application Insights (detected)
- Prometheus + Grafana (detected)
- Datadog (detected)
- None

---

## Step 4 — Install selected skills

Based on the persona + answers + detected signals, install relevant skills using `npx skills add <owner/repo>`:

### Skill mapping

| Signal / Answer | Skill to install |
|---|---|
| React (any) | `@react19-concurrent-patterns` |
| React + testing framework | `@react19-test-patterns` |
| C# / .NET | `@dotnet-best-practices` |
| .NET + EF Core | `@ef-core` |
| .NET + xUnit | `@csharp-xunit` |
| (always) | `@ob-generic-guardrails` (already installed) |
| (always) | `@ob-default` (already installed) |

Use the `@find-skills` skill workflow to discover skills for signals not in the table above. Check `skills-lock.json` to see what's already installed before installing duplicates.

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
- How to use: "This agent will be spawned by the lead during `/apply-plan` for tasks matching its specialty."
- "Restart opencode for the `ob-subagent-tiers` plugin to pick up the new engineer."

**Guidelines**
- Always keep `@ob-generic-guardrails` in the Guardrails ability
- NEVER use `@ob-default` in any ability category — all abilities must reference real installed skills
- One file per engineer — do NOT create `-build`/`-fast` variant files. The `ob-subagent-tiers` plugin injects tier variants at startup
- Skills should match both the persona AND the project's tech stack
- If `npx skills` CLI is not available, manually reference skills by their `owner/repo` name and tell the user to install them

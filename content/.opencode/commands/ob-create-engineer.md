---
description: Create a custom engineer agent from a description, with skills from skills.sh
---

Create a new custom engineer agent based on the `basic-engineer.md` template. The agent file is a **template** — it has NO `model:` field. The `ob-subagent-tiers` plugin reads it at startup and injects tier variants (`<name>.build`, `<name>.fast`, `<name>.plan`) into the live config with models from `wizard.models`.

**Usage**: `/ob-create-engineer <name> <tier> "<description>"`

- `<tier>` — one of `plan`, `build`, `fast`. This is the **default tier** the engineer is associated with (used for AGENTS.md documentation and user reference). The `ob-subagent-tiers` plugin creates all three tier variants at startup regardless — this just records the intended primary tier. Use `build` for most specialists, `plan` for heavy-reasoning roles (e.g. an architect), `fast` for light helpers.

Example: `/ob-create-engineer frontend-engineer build "A frontend engineer specialized in React, Next.js, and CSS"`

**Steps**

1. **Parse input**

   Extract `<name>`, `<tier>`, and `<description>` from the arguments after `/ob-create-engineer`.
   - Name MUST be a single lowercase word followed by `-engineer` (match `^[a-z0-9]+-engineer$`), e.g. `frontend-engineer`, `di-engineer`, `architect-engineer`. If the given name doesn't match (e.g. `frontend-engineer-di`), normalize it to that form (pick the most descriptive single word, e.g. `di-engineer`) before continuing. The `-engineer` suffix is required — discovery globs `*-engineer.md`.
   - Tier is one of `plan` / `build` / `fast` (default `build` if omitted)
   - Description is the quoted string explaining the agent's specialty
   - If no input provided, use the AskUserQuestion tool to ask for name, tier, and description.

2. **Discover relevant skills from skills.sh**

   Load the `@find-skills` skill and follow its workflow to discover skills relevant to the engineer's description.

   **Project context** — read `.opencode/source-roots.json` when present. Only analyze those roots. Read `ARCHITECTURE.md` and `DESIGN.md` to understand the project's tech stack and design system so skill choices match what the codebase actually uses.

<!-- OB-CMD-CODEGRAPH-START -->
   Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash. Use `codegraph_search` MCP tool to identify which code areas, modules, and frameworks the new engineer will work with.
<!-- OB-CMD-CODEGRAPH-END -->

   Use the `@find-skills` skill's guidance (check the skills.sh leaderboard first, then `npx skills find` with specific keywords) — do NOT manually browse skills.sh or invent skill names. Verify each candidate's install count and source reputation before selecting, as the skill instructs.

   Select 2-5 skills that are most relevant to the agent's role and are genuinely used by the project's tech stack. Prefer official/popular skills.

3. **Install selected skills**

   For each selected skill:
   ```bash
   npx skills add <owner/repo>
   ```

   This installs the skill files into the project.

4. **Create the agent file**

    Create `.opencode/agents/<name>.md` with this structure:

   ```markdown
   ---
   description: <description>
   mode: subagent
   color: <pick a theme color: primary|secondary|accent|success|warning|error|info>
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
   - Infrastructure: <@installed-skill-for-devops-cicd>, ...
```

   Keep the file minimal — **identity + abilities only**, exactly like `basic-engineer.md`. Do **NOT** add a `model:` field — the agent file is a template. Do **NOT** add a `## Workflow` section: the engineer workflow is defined once in `@ob-generic-guardrails` (every engineer loads it via its Guardrails ability), so it must not be duplicated in each agent file.

   Place the installed skills under the most relevant ability category:
   - **Development** — language frameworks, UI libraries, application code skills
   - **Testing** — test frameworks, linting, type checking, validation skills
   - **Infrastructure** — DevOps, CI/CD, cloud, deployment, containerization skills

   Distribute skills across ALL categories that apply. Only include categories that have at least one real skill assigned (besides Guardrails which is always present).

5. **No model in the agent file.** The agent file is a template with no `model:` field. The `ob-subagent-tiers` plugin reads it at startup and creates tier variants (`<name>.build`, `<name>.fast`, `<name>.plan`) with models from `wizard.models`. If all tiers are unset, warn the user to run `/ob-set-model <tier> <model>` and restart.

6. **Update AGENTS.md**

   Add the new agent to the agents table in AGENTS.md:
   ```
    | `<name>` | .opencode/agents/<name>.md | <short role description> |
   ```

7. **Show summary**

   Report:
    - Agent file created at `.opencode/agents/<name>.md` (template, no model — tier variants injected by `ob-subagent-tiers` plugin at startup)
   - Skills installed (list each with source)
   - How to use: "This agent will be spawned by the lead during `/ob-apply` for tasks matching its specialty."

**Guidelines**
- Always keep `@ob-generic-guardrails` in the Guardrails ability
- NEVER use `@ob-default` in any ability category - all abilities must reference real installed skills
- **Development** = language/framework/UI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps, CI/CD, cloud, deployment skills. Never put UI/CSS skills under Infrastructure.
- Distribute installed skills across the appropriate categories — not just Development
- Only include ability categories that have at least one real skill assigned
- Pick a theme color not used by existing agents — read their `color:` frontmatter first (basic-engineer uses `success`)
- Skills should match both the agent description AND the project's tech stack
- If `npx skills` CLI is not available, manually reference skills by their `owner/repo` name in the abilities section and tell the user to install them
- One file per engineer — do NOT create `-build`/`-fast` variant files. The agent file is a template with no `model:`. The `ob-subagent-tiers` plugin injects tier variants at startup.

---
description: Create a custom engineer agent from a description, with skills from skills.sh
---

Create a new custom engineer agent based on the `basic-engineer.md` template. One file per engineer — no variants. The engineer's **model is fixed by its tier** (chosen here), since OpenCode resolves a subagent's model from its agent file.

**Usage**: `/ob-create-engineer <name> <tier> "<description>"`

- `<tier>` — one of `plan`, `build`, `fast`. Maps to `.opencode/opencode-onboard.json` → `wizard.models[<tier>]`. Use `build` for most specialists, `plan` for heavy-reasoning roles (e.g. an architect), `fast` for light helpers.

Example: `/ob-create-engineer frontend-engineer build "A frontend engineer specialized in React, Next.js, and CSS"`

**Steps**

1. **Parse input**

   Extract `<name>`, `<tier>`, and `<description>` from the arguments after `/ob-create-engineer`.
   - Name should be kebab-case (e.g., `frontend-engineer`)
   - Tier is one of `plan` / `build` / `fast` (default `build` if omitted)
   - Description is the quoted string explaining the agent's specialty
   - If no input provided, use the AskUserQuestion tool to ask for name, tier, and description.

2. **Search for relevant skills from skills.sh**

   Based on the description and the project context (read ARCHITECTURE.md, DESIGN.md), search for relevant skills:

   ```bash
   npx skills search "<relevant keywords from description>"
   ```

   If the search doesn't work or returns nothing, browse https://www.skills.sh/ for relevant skills based on the agent's specialty.

   Select 2-5 skills that are most relevant to the agent's role. Prefer official/popular skills.

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
   model: <wizard.models[<tier>] from .opencode/opencode-onboard.json>
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

   ## Workflow

   When the lead spawns you via the task tool, your assigned task IDs and text are already in your prompt:
1. Load `@ob-global` first, then the mandatory `Guardrails` ability.
2. Load the additional abilities from `## Abilities` relevant to your task domain (development, testing, infrastructure). Each ability may list several skills; load all that apply.
3. If available, read shared context from basic-memory (`search` the change context note and any `task-<id>-result` notes your tasks depend on) and use `codegraph_search` to locate the relevant symbols.
4. Implement your assigned tasks in dependency order, following every loaded skill rule. Edit only files within your assigned scope.
5. If available, write a `task-<id>-result` note to basic-memory summarizing what you changed and any decisions.
6. Return a concise summary of what you did — that is your result to the lead. Then you exit; you do not poll, claim, or wait for more work.
```

   Place the installed skills under the most relevant ability category:
   - **Development** — language frameworks, UI libraries, application code skills
   - **Testing** — test frameworks, linting, type checking, validation skills
   - **Infrastructure** — DevOps, CI/CD, cloud, deployment, containerization skills

   Distribute skills across ALL categories that apply. Only include categories that have at least one real skill assigned (besides Guardrails which is always present).

5. **Resolve the model from the tier**

   Read `wizard.models[<tier>]` from `.opencode/opencode-onboard.json` and put it in the agent file's `model:` frontmatter line (step 4). This is the model the engineer runs on — OpenCode reads it from the agent file when the lead spawns it. If that tier's model is unset, omit `model:` (the engineer inherits the lead's model) and warn the user to run `/ob-set-model <tier> <model>`.

6. **Update AGENTS.md**

   Add the new agent to the agents table in AGENTS.md:
   ```
    | `<name>` | .opencode/agents/<name>.md | <short role description> |
   ```

7. **Show summary**

   Report:
    - Agent file created at `.opencode/agents/<name>.md` (tier `<tier>` → model `<resolved id>`)
   - Skills installed (list each with source)
   - How to use: "This agent will be spawned by the lead during `/ob-apply` for tasks matching its specialty."

**Guidelines**
- Always keep `@ob-generic-guardrails` in the Guardrails ability
- NEVER use `@ob-default` in any ability category - all abilities must reference real installed skills
- **Development** = language/framework/UI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps, CI/CD, cloud, deployment skills. Never put UI/CSS skills under Infrastructure.
- Distribute installed skills across the appropriate categories — not just Development
- Only include ability categories that have at least one real skill assigned
- Pick a color that doesn't conflict with existing agents (basic-engineer uses #68A063)
- Skills should match both the agent description AND the project's tech stack
- If `npx skills` CLI is not available, manually reference skills by their `owner/repo` name in the abilities section and tell the user to install them
- One file per engineer — do NOT create `-build`/`-fast` variant files. The model comes from the chosen tier and is stamped into the single agent file.

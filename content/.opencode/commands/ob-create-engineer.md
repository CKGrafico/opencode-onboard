---
description: Create a custom engineer agent from a description, with skills from skills.sh
---

Create a new custom engineer agent based on the `basic-engineer.md` template.

**Usage**: `/ob-create-engineer <name> "<description>"`

Example: `/ob-create-engineer frontend-engineer "A frontend engineer specialized in React, Next.js, and CSS"`

**Steps**

1. **Parse input**

   Extract `<name>` and `<description>` from the arguments after `/ob-create-engineer`.
   - Name should be kebab-case (e.g., `frontend-engineer`)
   - Description is the quoted string explaining the agent's specialty
   - If no input provided, use the AskUserQuestion tool to ask for both.

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

   Create `.agents/agents/<name>.md` with this structure:

   ```markdown
   ---
   description: <description>
   mode: subagent
   color: <pick a unique hex color>
   temperature: 0.2
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

   When spawned by the lead:
   1. Call `team_tasks_list` and verify your assigned task IDs and status before starting.
   2. For each assigned task: before calling `team_claim task_id:<id>`, check `team_tasks_list` to confirm every dependency of that task has status `done`. If any dependency is not done, skip to the next assigned task that IS unblocked. Only claim tasks whose dependencies are fully complete.
   3. Load `@ob-global` first, then load mandatory ability `Guardrails`.
   4. Load additional abilities from the `## Abilities` section as needed for the claimed task domain (for example: development, testing, infrastructure). Each ability can include one or more skills; load all relevant skills listed under each selected ability.
   5. Send a short `team_message` to lead confirming claimed task ID and loaded skills.
   6. Implement the task following all loaded skill rules.
   7. Call `team_tasks_complete task_id:<id>` after finishing that task.
   8. Repeat until all currently assigned tasks are completed or blocked.
   9. Message lead with results via `team_message`. Lead may assign more tasks, do NOT stop working or shut down until lead confirms no more tasks for you.
   10. If lead sends new task IDs via `team_message`, treat them as new assignments and go back to step 2.
   ```

   Place the installed skills under the most relevant ability category:
   - **Development** — language frameworks, UI libraries, application code skills
   - **Testing** — test frameworks, linting, type checking, validation skills
   - **Infrastructure** — DevOps, CI/CD, cloud, deployment, containerization skills

   Distribute skills across ALL categories that apply. Only include categories that have at least one real skill assigned (besides Guardrails which is always present).

5. **Update AGENTS.md**

   Add the new agent to the agents table in AGENTS.md:
   ```
   | `<name>` | .agents/agents/<name>.md | <short role description> |
   ```

6. **Show summary**

   Report:
   - Agent file created at `.agents/agents/custom-engineer-<name>.md`
   - Skills installed (list each with source)
   - How to use: "This agent will be spawned by the lead during `/opsx-apply` for tasks matching its specialty."

**Guidelines**
- Always keep `@ob-generic-guardrails` in the Guardrails ability
- NEVER use `@ob-default` in any ability category - all abilities must reference real installed skills
- **Development** = language/framework/UI skills. **Testing** = test/lint/typecheck skills. **Infrastructure** = DevOps, CI/CD, cloud, deployment skills. Never put UI/CSS skills under Infrastructure.
- Distribute installed skills across the appropriate categories — not just Development
- Only include ability categories that have at least one real skill assigned
- Pick a color that doesn't conflict with existing agents (basic-engineer uses #68A063)
- Skills should match both the agent description AND the project's tech stack
- If `npx skills` CLI is not available, manually reference skills by their `owner/repo` name in the abilities section and tell the user to install them

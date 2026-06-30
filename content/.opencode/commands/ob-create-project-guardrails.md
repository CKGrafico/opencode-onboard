---
description: Generate or update a project-guardrails skill from ARCHITECTURE.md and relevant project files.
---

Analyze `ARCHITECTURE.md` and other project files to generate or update a `project-guardrails` skill — a set of rules and constraints extracted from the project's own documentation that agents must follow.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

**Steps**

1. **Check current state**

   Read `.agents/skills/project-guardrails/SKILL.md`. Determine which mode to use:
   - **Does not exist** → **Generate mode**: create from scratch.
   - **Exists** and has a `<!-- Last updated:` footer → **Update mode**: incrementally update.
   - **Exists** but no timestamp → proceed in **Generate mode** (full regeneration).

2a. **Generate mode — read source documents**

   Read ALL of the following that exist:
   - `ARCHITECTURE.md` (primary source)
   - `DESIGN.md` (design system, component conventions)
   - `AGENTS.md` (existing agent instructions, optimizations)
   - `README.md` (setup, conventions)
   - `CONTRIBUTING.md` (if present)
   - `.opencode/opencode-onboard.json` (platform, models, concurrency)
   - `openspec/config.yaml` (if present — domain context and rules)
   - Root config files: `package.json`, `tsconfig.json`, `biome.json`, `.eslintrc*`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `pom.xml` — whatever exists
   - CI/CD workflows: `.github/workflows/*`, `azure-pipelines.yml` — whatever exists

   Use file tools to discover constraints: `read` the documents above, `grep` for lint/formatter config rules.

<!-- OB-CMD-CODEGRAPH-START -->
   Use codegraph MCP for code intelligence:
   - `codegraph_search` to find module boundaries, forbidden cross-imports, and dependency violations.
   - `codegraph_impact` to understand which modules are coupled.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
   Use basic-memory MCP for persistent context:
   - `search` for any prior `guardrails-summary` note from a previous run.
<!-- OB-CMD-MEMORY-END -->

   Do not rely on prior knowledge — read the actual files and query the actual code graph.

2b. **Update mode — incremental analysis**

   Extract the `<!-- Last updated: <ISO date> -->` timestamp from the existing skill file. Then:
   - Read `ARCHITECTURE.md` and check its `<!-- Last updated:` timestamp. If ARCHITECTURE.md hasn't changed since the guardrails were last generated, report "Guardrails up to date" and stop.
   - Run `git log --oneline --since="<date>" -- <config files, lint configs, CI workflows}` to find what convention/config files changed.
   - If nothing changed: report "Guardrails up to date" and stop.
<!-- OB-CMD-CODEGRAPH-START -->
   - Use `codegraph_search` to check if module boundaries or import patterns changed.
<!-- OB-CMD-CODEGRAPH-END -->
<!-- OB-CMD-MEMORY-START -->
   - Use `basic-memory` `search` for the `guardrails-summary` note from the previous run to compare.
<!-- OB-CMD-MEMORY-END -->
   - Update only the affected rule categories. Preserve manually-added rules in unchanged categories.
   - If changes are pervasive (new architecture, new framework, new platform), fall back to **Generate mode**.

3. **Extract guardrails**

   From the documents and code graph analysis, extract concrete, actionable rules in these categories. Only include a category if you found real evidence for it:

   - **Architecture constraints** — layer boundaries, module dependencies, forbidden imports, directory ownership rules (e.g. "src/api/ must not import from src/ui/"). Use codegraph to verify actual import boundaries.
   - **Naming conventions** — file naming, component naming, API route conventions, branch naming
   - **Code style** — formatter config, lint rules, import ordering, max line length — derive from actual config files, not guesses
   - **Testing rules** — test file locations, naming, coverage gates, what must be tested before merge
   - **Build & deployment** — build commands, env requirements, deployment targets, CI gates
   - **Data & state** — migration rules, schema change process, state management patterns
   - **Security** — auth boundaries, input validation requirements, secrets handling
   - **Dependencies** — package manager, lockfile rules, upgrade policy, forbidden packages
   - **Git workflow** — branch naming, commit message format, PR process (platform-specific from `opencode-onboard.json`)
   - **Domain-specific rules** — anything in `openspec/config.yaml` context or `ARCHITECTURE.md` constraints/risks sections

   Each rule must be:
   - **Concrete** — "Use `pnpm` not `npm`" not "Use the right package manager"
   - **Evidence-based** — derive from the files/code graph you analyzed, do not invent rules
   - **Actionable** — an agent can check it before acting

4. **Write the skill**

   Write (or update) `.agents/skills/project-guardrails/SKILL.md`:

   ```markdown
   ---
   name: project-guardrails
   description: Project-specific rules and constraints extracted from ARCHITECTURE.md. Load this skill before implementing any change to understand boundaries, conventions, and constraints for this codebase.
   license: MIT
   ---

   # Project Guardrails

   > Auto-generated by `/ob-create-project-guardrails`. Regenerate with the same command when architecture or conventions change.

   ## Architecture Constraints
   - <rule>
   - <rule>

   ## Naming Conventions
   - <rule>

   ## Code Style
   - <rule>

   ## Testing
   - <rule>

   ## Build & Deployment
   - <rule>

   ## Data & State
   - <rule>

   ## Security
   - <rule>

   ## Dependencies
   - <rule>

   ## Git Workflow
   - <rule>

   <!-- Last updated: <current ISO timestamp> -->
   ```

   Only include sections that have real rules. Omit empty sections.

5. **Update agents**

   For every `*-engineer.md` in `.opencode/agents/`, add `@project-guardrails` to the Guardrails ability line (skip if already present):
   ```markdown
   ## Abilities
   - Guardrails: @ob-generic-guardrails, @project-guardrails, @ob-default
   ```

   Exclude tier variant files (`*-engineer.build.md`, `*-engineer.fast.md`, `*-engineer.plan.md`) — they are generated copies; only update the base templates.

6. **Store summary in basic-memory**

<!-- OB-CMD-MEMORY-START -->
   `write_note` with title `guardrails-summary` containing:
   - The ISO timestamp of this run
   - Number of rules per category
   This lets future runs compare and incrementally update.
<!-- OB-CMD-MEMORY-END -->

7. **Report**

   Tell the user:
   - Whether the skill was generated or updated (and which categories changed)
   - Whether codegraph / basic-memory were used or degraded to file tools
   - Number of rules extracted per category
   - Number of agent files updated
   - Tip: "Rerun `/ob-create-project-guardrails` any time the architecture or conventions change significantly."

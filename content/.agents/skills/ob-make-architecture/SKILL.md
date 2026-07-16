---
name: ob-make-architecture
description: Generate or update ARCHITECTURE.md by analyzing the codebase structure. Safe to run at any time. Invoked by the /make-architecture command and the repo-initialize flow.
license: MIT
---

# Make Architecture

Analyze the architecture of this codebase and generate or update `ARCHITECTURE.md` in the project root.

**Steps**

1. **Check current state**

   Read `ARCHITECTURE.md`. Determine which mode to use:
   - **Does not exist** or is a placeholder (no real content) → **Generate mode**: create from scratch.
   - **Exists with content** and has a `<!-- Last updated:` footer → **Update mode**: incrementally update (see step 2b).
   - **Exists with content** but no timestamp → warn the user, then proceed in **Generate mode** (full regeneration).

2a. **Generate mode: analyze the codebase**

   Read `.opencode/source-roots.json` when present. Only analyze those roots plus this repo's docs/config files.

   Use file tools to discover the architecture: `glob` for folder structure, `grep` for route/model/schema definitions, `read` config files, CI/CD workflows, Dockerfiles, README, changelogs, ADRs.

   Do not rely on prior knowledge: read the actual files and query the actual code graph.

2b. **Update mode: incremental analysis**

   Extract the `<!-- Last updated: <ISO date> -->` timestamp from the existing file. Then:
   - Run `git log --oneline --since="<date>" -- <source roots}` to find what changed since the last analysis.
   - If nothing changed: report "Architecture unchanged since last update" and stop.
   - For each changed area, understand what's affected.
   - Update only the affected sections. Preserve manually-added content in unchanged sections.
   - If the changes are too pervasive (more than ~40% of sections affected), fall back to **Generate mode**.

3. **Write ARCHITECTURE.md**

   Write (or update) `ARCHITECTURE.md` following this structure:

   - **Architecture Overview**: what the system is, what problem it solves, major architectural style
   - **1. Project Structure**: annotated directory tree with purpose of each major directory
   - **2. High-Level System Diagram**: Mermaid diagram of actors, services, data stores, external systems
   - **3. Core Components**: each major component: name, responsibility, key files, technologies, inputs/outputs
     - 3.1 Frontend / User Interface (if present)
     - 3.2 Backend / Server / API (if present)
     - 3.3 Shared Libraries / Common Code (if present)
     - 3.4 CLI / Scripts / Automation (if present)
   - **4. Data Flow**: request lifecycle, key user journeys, sequence diagram for main runtime flow
   - **5. Data Stores**: all persistent storage: type, purpose, schemas, migration approach
   - **6. External Integrations / APIs**: each integration: method, config location, auth, failure behavior
   - **7. Key Technologies**: full stack summary with architectural relevance of each
   - **8. Deployment & Infrastructure**: build artifacts, env config, containerization, CI/CD, hosting
   - **9. Security Architecture**: auth, authz, secrets, input validation, trust boundaries
   - **10. Monitoring & Observability**: logging, metrics, tracing, error reporting
   - **11. Performance & Scalability**: caching, batching, concurrency, known bottlenecks
   - **12. Development Workflow**: local setup, install/dev/test/build/lint commands
   - **13. Testing Strategy**: test frameworks, locations, coverage gates, gaps
   - **14. Architectural Decisions & Rationale**: key choices with evidence and tradeoffs
   - **15. Constraints, Risks, and Technical Debt**: tight coupling, TODOs, operational risks
   - **16. Future Considerations**: documented roadmap + reasonable recommendations (labeled as such)
   - **17. Project Identification**: name, language, type, runtime, date of review, maintainer
   - **18. Glossary / Acronyms**: project-specific terms an agent or new developer needs to know

   Append at the very end of the file:
   ```
   <!-- Last updated: <current ISO timestamp> -->
   ```

   Rules:
   - Be specific and concrete: include actual directories, files, modules, commands
   - Do NOT invent systems, services, or integrations not supported by repository evidence
   - Mark anything undiscoverable as "Not evident from the repository"
   - Use Mermaid diagrams where helpful
   - Write as if this document will be committed and maintained over time

4. **Store summary in agentmemory**

   `write_note` MCP tool with title `architecture-summary` containing:
   - The ISO timestamp of this run
   - A bullet list of top-level components found
   - Any key architectural decisions or risks identified

5. **Report**

   Tell the user:
   - Whether ARCHITECTURE.md was generated or updated (and which sections changed)
   - Top-level components found
   - Tip: "Rerun `/make-architecture` any time the architecture changes significantly."

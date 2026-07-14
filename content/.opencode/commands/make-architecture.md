---
description: Generate or update ARCHITECTURE.md by analyzing the codebase structure. Safe to run at any time.
---

Analyze the architecture of this codebase and generate or update `ARCHITECTURE.md` in the project root.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

Reference material:
  Website : https://architecture.md/
  Repo    : https://github.com/timajwilliams/architecture

**Steps**

1. **Check current state**

   Read `ARCHITECTURE.md`. Determine which mode to use:
   - **Does not exist** or is a placeholder (no real content) → **Generate mode**: create from scratch.
   - **Exists with content** and has a `<!-- Last updated:` footer → **Update mode**: incrementally update (see step 2b).
   - **Exists with content** but no timestamp → warn the user, then proceed in **Generate mode** (full regeneration).

2a. **Generate mode — analyze the codebase**

   Read `.opencode/source-roots.json` when present. Only analyze those roots plus this repo's docs/config files.

   Use file tools to discover the architecture: `glob` for folder structure, `grep` for route/model/schema definitions, `read` config files, CI/CD workflows, Dockerfiles, README, changelogs, ADRs.

<!-- OB-CMD-CODEGRAPH-START -->
   Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash — use the MCP tools directly.
   - `codegraph_search` to find components, entry points, and module boundaries.
   - `codegraph_impact` to trace dependency chains between modules.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
   Use basic-memory MCP tools (NOT CLI commands). Do NOT run `basic-memory` in bash — use the MCP tools directly.
   - `search` for any prior architecture notes, ADRs, or decisions stored by previous runs or agents.
<!-- OB-CMD-MEMORY-END -->

   Do not rely on prior knowledge — read the actual files and query the actual code graph.

2b. **Update mode — incremental analysis**

   Extract the `<!-- Last updated: <ISO date> -->` timestamp from the existing file. Then:
   - Run `git log --oneline --since="<date>" -- <source roots}` to find what changed since the last analysis.
   - If nothing changed: report "Architecture unchanged since last update" and stop.
   - For each changed area, understand what's affected.
<!-- OB-CMD-CODEGRAPH-START -->
   - Use `codegraph_search` / `codegraph_impact` MCP tools to understand what's affected.
<!-- OB-CMD-CODEGRAPH-END -->
<!-- OB-CMD-MEMORY-START -->
   - Use `basic-memory` `search` MCP tool for the `architecture-summary` note from the previous run.
<!-- OB-CMD-MEMORY-END -->
   - Update only the affected sections. Preserve manually-added content in unchanged sections.
   - If the changes are too pervasive (more than ~40% of sections affected), fall back to **Generate mode**.

3. **Write ARCHITECTURE.md**

   Write (or update) `ARCHITECTURE.md` following this structure:

   - **Architecture Overview** — what the system is, what problem it solves, major architectural style
   - **1. Project Structure** — annotated directory tree with purpose of each major directory
   - **2. High-Level System Diagram** — Mermaid diagram of actors, services, data stores, external systems
   - **3. Core Components** — each major component: name, responsibility, key files, technologies, inputs/outputs
     - 3.1 Frontend / User Interface (if present)
     - 3.2 Backend / Server / API (if present)
     - 3.3 Shared Libraries / Common Code (if present)
     - 3.4 CLI / Scripts / Automation (if present)
   - **4. Data Flow** — request lifecycle, key user journeys, sequence diagram for main runtime flow
   - **5. Data Stores** — all persistent storage: type, purpose, schemas, migration approach
   - **6. External Integrations / APIs** — each integration: method, config location, auth, failure behavior
   - **7. Key Technologies** — full stack summary with architectural relevance of each
   - **8. Deployment & Infrastructure** — build artifacts, env config, containerization, CI/CD, hosting
   - **9. Security Architecture** — auth, authz, secrets, input validation, trust boundaries
   - **10. Monitoring & Observability** — logging, metrics, tracing, error reporting
   - **11. Performance & Scalability** — caching, batching, concurrency, known bottlenecks
   - **12. Development Workflow** — local setup, install/dev/test/build/lint commands
   - **13. Testing Strategy** — test frameworks, locations, coverage gates, gaps
   - **14. Architectural Decisions & Rationale** — key choices with evidence and tradeoffs
   - **15. Constraints, Risks, and Technical Debt** — tight coupling, TODOs, operational risks
   - **16. Future Considerations** — documented roadmap + reasonable recommendations (labeled as such)
   - **17. Project Identification** — name, language, type, runtime, date of review, maintainer
   - **18. Glossary / Acronyms** — project-specific terms an agent or new developer needs to know

   Append at the very end of the file:
   ```
   <!-- Last updated: <current ISO timestamp> -->
   ```

   Rules:
   - Be specific and concrete — include actual directories, files, modules, commands
   - Do NOT invent systems, services, or integrations not supported by repository evidence
   - Mark anything undiscoverable as "Not evident from the repository"
   - Use Mermaid diagrams where helpful
   - Write as if this document will be committed and maintained over time

4. **Store summary in basic-memory**

<!-- OB-CMD-MEMORY-START -->
   `write_note` MCP tool with title `architecture-summary` containing:
   - The ISO timestamp of this run
   - A bullet list of top-level components found
   - Any key architectural decisions or risks identified
<!-- OB-CMD-MEMORY-END -->

5. **Report**

   Tell the user:
   - Whether ARCHITECTURE.md was generated or updated (and which sections changed)
<!-- OB-CMD-CODEGRAPH-START -->
   - Whether codegraph / basic-memory were used or degraded to file tools
<!-- OB-CMD-CODEGRAPH-END -->
<!-- OB-CMD-MEMORY-START -->
   - Whether basic-memory was used or degraded to file tools
<!-- OB-CMD-MEMORY-END -->
   - Top-level components found
   - Tip: "Rerun `/make-architecture` any time the architecture changes significantly."

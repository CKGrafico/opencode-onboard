---
description: Generate or regenerate ARCHITECTURE.md by analyzing the codebase structure. Safe to run at any time.
---

Analyze the architecture of this codebase and generate a populated `ARCHITECTURE.md` in the project root.

Reference material:
  Website : https://architecture.md/
  Repo    : https://github.com/timajwilliams/architecture

**Steps**

1. **Check current state**

   Read `ARCHITECTURE.md`. If it already contains real content (not the placeholder), warn the user:
   > "ARCHITECTURE.md already has content. Running this will overwrite it. Proceeding..."

   Then continue regardless — this command is always safe to rerun.

2. **Check for source roots**

   Load `.agents/source-roots.json` when present. Only analyze those roots plus this repo's docs/config files.

3. **Analyze the codebase**

   Read:
   - Folder structure, root-level config files
   - Route/controller definitions
   - Data models, schemas, migrations
   - Integration points, external API calls
   - Build config, CI/CD workflows, Dockerfiles
   - README, changelogs, ADRs, any existing docs

   Do not rely on prior knowledge — read the actual files.

4. **Write ARCHITECTURE.md**

   Overwrite `ARCHITECTURE.md` with a complete document following this structure:

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

   Rules:
   - Be specific and concrete — include actual directories, files, modules, commands
   - Do NOT invent systems, services, or integrations not supported by repository evidence
   - Mark anything undiscoverable as "Not evident from the repository"
   - Use Mermaid diagrams where helpful
   - Write as if this document will be committed and maintained over time

5. **Report**

   Tell the user:
   - `ARCHITECTURE.md` generated successfully
   - Top-level components found
   - Tip: "Rerun `/ob-create-architecture` any time the architecture changes significantly."

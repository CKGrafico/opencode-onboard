> Execute this command.

Analyze the architecture of this codebase with the goal of creating an ARCHITECTURE.md file in the project root and giving the user a file for easy copy & pasting.

Reference material:
  Website : https://architecture.md/
  Repo    : https://github.com/timajwilliams/architecture

Requirements:
- Create a complete ARCHITECTURE.md document that enables rapid codebase comprehension for both human developers and AI agents.
- The file must be entirely self-contained. Do not say “see X file” as a substitute for explanation; include the relevant architectural facts directly in the document.
- Be specific and concrete: include actual directories, important files, modules, services, classes, APIs, commands, data stores, configuration points, and integration boundaries where they are discoverable from the codebase.
- Do not invent systems, services, infrastructure, deployment targets, databases, queues, third-party APIs, or security mechanisms that are not supported by evidence in the repository.
- When something cannot be determined from the codebase, explicitly mark it as “Not evident from the repository” rather than guessing.
- Prefer durable architectural facts over transient implementation details. Focus on things that help someone understand where to make changes and how the system fits together.
- Include diagrams using Mermaid where helpful, especially for system context, component relationships, request/data flow, and deployment topology.
- If Mermaid is not appropriate or the architecture is simple, include a clear text-based diagram instead.
- If architecture decisions or tradeoffs are visible from the code, document the rationale and consequences.
- Include technical debt, risks, unclear boundaries, and future architecture considerations when supported by TODOs, comments, docs, issue references, or code structure.
- Use Markdown only. Do not rely on external images, generated assets, or links to local files.
- Write the document as if it will be committed to the repository and maintained over time.

Recommended ARCHITECTURE.md structure:

# Architecture Overview

Briefly describe what the system is, what problem it solves, who/what uses it, and the major architectural style or pattern if evident.

## 1. Project Structure

Provide a high-level annotated tree of the repository. Explain the purpose of each major directory and the architectural layer or concern it represents.

Include:
- Root-level files that affect architecture, build, runtime, deployment, or developer workflow
- Source directories and their responsibilities
- Test directories and their scope
- Configuration, scripts, generated code, migrations, schemas, or infrastructure directories if present

## 2. High-Level System Diagram

Provide a Mermaid diagram or text diagram showing the major actors, applications, services, data stores, and external systems.

The diagram should emphasize:
- User or client entry points
- Application/runtime boundaries
- Internal services or modules
- Data stores
- External APIs or platforms
- Direction of communication/data flow

## 3. Core Components

Describe each major component of the system.

For each component include:
- Name
- Responsibility
- Important files/directories
- Key technologies/frameworks
- Runtime role
- Main inputs and outputs
- Dependencies on other components
- Notes about ownership of business logic, state, or side effects

Use subsections such as:

### 3.1 Frontend / User Interface

If present, document:
- Framework and rendering model
- Routing/page structure
- State management
- API/data access pattern
- Component organization
- Styling/design-system approach if architecturally relevant
- Build output and deployment assumptions

### 3.2 Backend / Server / API

If present, document:
- Framework/runtime
- Entry points
- Routing/controller structure
- Service/business-logic layer
- Persistence layer
- Middleware
- Authentication/authorization flow
- Background jobs/workers if present

### 3.3 Shared Libraries / Common Code

If present, document:
- Shared types
- Utilities
- Domain models
- Validation schemas
- Cross-cutting abstractions

### 3.4 CLI / Scripts / Automation

If present, document:
- Command entry points
- Build/test/deploy automation
- Code generation
- Data seeding/migration scripts

## 4. Data Flow

Explain how data moves through the system.

Include:
- Main request lifecycle
- Important user journeys or system workflows
- Read/write paths
- Validation boundaries
- Serialization/deserialization points
- Error handling paths
- Async/event-driven flows if present

Add a Mermaid sequence diagram for the most important runtime flow when possible.

## 5. Data Stores

List and describe all persistent or semi-persistent storage mechanisms evident in the codebase.

For each data store include:
- Name
- Type/technology
- Purpose
- Main schemas/tables/collections/entities if discoverable
- Ownership boundaries
- Migration or schema management approach
- Backup, retention, or lifecycle details if evident

If no persistent storage is evident, say so.

## 6. External Integrations / APIs

Document all external systems the codebase integrates with.

For each integration include:
- Service name
- Purpose
- Integration method, such as REST, GraphQL, SDK, webhook, OAuth, file import/export, message queue
- Where it is configured or called
- Authentication method if evident
- Failure/retry behavior if evident

## 7. Key Technologies

Summarize the technical stack.

Include:
- Languages
- Frameworks
- Runtime/platform
- Package managers
- Build tools
- Testing tools
- Linters/formatters
- Infrastructure/deployment tools
- Observability tools
- Important libraries that shape the architecture

Explain why each technology matters architecturally, not just that it exists.

## 8. Deployment & Infrastructure

Describe how the system appears to be built, packaged, configured, and deployed.

Include:
- Build artifacts
- Environment variables/configuration model
- Containerization if present
- Hosting/deployment target if evident
- CI/CD workflows
- Infrastructure-as-code
- Runtime process model
- Scaling assumptions if evident

If deployment is not evident from the repository, state that clearly and summarize what would need to be known.

## 9. Security Architecture

Document security-relevant architecture.

Include:
- Authentication
- Authorization
- Session/token handling
- Secrets management
- Input validation
- Data encryption in transit/at rest if evident
- CORS/CSP/security headers if present
- Dependency or supply-chain security measures
- Trust boundaries
- Sensitive data handling

Do not claim security controls exist unless the codebase shows them.

## 10. Monitoring & Observability

Document how the system can be debugged and observed.

Include:
- Logging approach
- Metrics
- Tracing
- Error reporting
- Health checks
- Audit logs
- Debug tooling
- Operational dashboards or monitoring services if evident

If observability is minimal or absent, say so and identify the current gaps.

## 11. Performance & Scalability

Document performance-sensitive parts of the architecture.

Include:
- Caching
- Pagination
- Batching
- Background processing
- Database query patterns
- Asset optimization
- Concurrency model
- Known bottlenecks
- Scaling limits or assumptions

Only include claims supported by code, configuration, or documentation.

## 12. Development Workflow

Explain how developers work with the project.

Include:
- Local setup
- Required tools/runtime versions
- Install commands
- Development server commands
- Test commands
- Build commands
- Lint/format/typecheck commands
- Database setup/migrations if present
- Common development loops

Keep this section architecture-focused; do not duplicate a README unless the workflow affects system structure.

## 13. Testing Strategy

Describe the testing architecture.

Include:
- Test frameworks
- Unit/integration/e2e test locations
- Fixtures/mocks
- Test data strategy
- CI test execution
- Coverage or quality gates if evident
- Gaps in test coverage if inferable from the repository

## 14. Architectural Decisions & Rationale

Capture important architectural choices visible in the codebase.

For each decision include:
- Decision
- Evidence in the codebase
- Rationale if inferable
- Consequences/tradeoffs
- Alternatives if mentioned in docs/comments

Do not invent historical rationale. If rationale is unclear, say “Rationale not documented.”

## 15. Constraints, Risks, and Technical Debt

Document:
- Architectural constraints
- Known limitations
- Tight coupling
- Duplicated abstractions
- Missing boundaries
- Incomplete migrations
- TODO/FIXME items with architectural impact
- Operational risks
- Security or scalability concerns

Each item should include why it matters and where the evidence appears in the codebase.

## 16. Future Considerations / Roadmap

Summarize future architectural changes that are evident from code comments, docs, TODOs, roadmap files, or incomplete abstractions.

Separate:
- Explicitly documented future work
- Reasonable architectural recommendations based on current structure

Clearly label recommendations as recommendations.

## 17. Project Identification

Include:
- Project name
- Repository purpose
- Primary language(s)
- Application type
- Main runtime(s)
- Date of last architecture review
- Maintainer/team if evident

Use today’s date for “Date of last architecture review.”

## 18. Glossary / Acronyms

Define project-specific terms, acronyms, domain concepts, and internal names that a new developer or AI agent needs to know.

Validation pass:
- Verify every named component, service, data store, integration, and technology against the repository.
- Remove placeholders.
- Remove generic template text.
- Replace vague statements with concrete codebase-specific facts.
- Ensure every major source directory is represented somewhere in the document.
- Ensure the high-level diagram matches the written component descriptions.
- Ensure the document is useful to someone trying to answer: “Where do I make a change, and what will it affect?”
- If access to a running local server, tests, build output, generated docs, API schema, database schema, Docker environment, or screenshots is available, use them to validate and revise the architecture description.
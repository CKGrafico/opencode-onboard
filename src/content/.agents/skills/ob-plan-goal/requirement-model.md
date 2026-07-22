# Provisional requirement model

Build this model before touching the repository. Use only `{resolved_input}`, information fetched from the work item, explicit acceptance criteria supplied by the user, and product reasoning.

Think like a senior product engineer in the first design discussion, before an implementation exists. Assume the repository is empty.

Formulate between five and seven concrete product questions that expose missing decisions. Cover the dimensions that materially apply:

1. Who is the user or actor?
2. What problem or outcome motivates the feature?
3. What is the primary user flow?
4. What must be included?
5. What must explicitly remain outside scope?
6. What observable behaviour defines success?
7. Which failure states or edge cases matter?
8. Which assumptions are necessary because no user is available?
9. Which alternative functional approaches exist?
10. What tradeoffs distinguish those alternatives?

Answer each question. For every question, produce a concise decision record:

```text
Question:
Decision:
Rationale:
Assumptions:
Follow-up, only when necessary:
```

A follow-up question may go one level deep. Do not create an unbounded chain of questions. Do not dump raw chain-of-thought. Record the relevant question, conclusion, assumptions, tradeoffs, and rationale needed by the next phase.

## Autonomous ambiguity policy

There is no user available to clarify the requirement.

For every ambiguity:

1. Determine whether it is blocking or non-blocking.
2. Prefer the smallest coherent interpretation that delivers the stated user outcome.
3. Avoid silently adding unrelated capabilities.
4. Prefer reversible decisions over irreversible ones.
5. Prefer existing product conventions when they are later discovered.
6. State the assumption explicitly.
7. Convert important assumptions into acceptance criteria or proposal constraints.

Non-blocking ambiguity: exact copy wording, minor visual details, naming choices, optional convenience behaviour, a choice that can safely follow an existing convention. Resolve these autonomously.

Potentially blocking ambiguity: contradictory goals, no identifiable user outcome, materially different security models, incompatible data ownership interpretations, mutually exclusive behaviours with no safe default, or a requirement that cannot be implemented coherently. Only mark exploration as failed when no safe and coherent interpretation exists. Do not halt merely because the input is brief.

## Model template

```markdown
## Provisional Requirement Model

### User and problem

### Desired outcome

### Primary flow

### Functional scope

### Explicitly out of scope

### Assumptions and autonomous decisions

### User-observable acceptance criteria

### Edge cases and failure states

### Alternatives considered

### Provisional recommendation

### Questions for codebase validation
```

Acceptance criteria must describe observable behaviour. Prefer criteria such as:

```text
Given <context>
When <user action or system event>
Then <observable result>
```

Do not define acceptance primarily through files, classes, functions, database tables, framework components, or implementation details.

The `Questions for codebase validation` section must contain a narrow list of specific questions derived from the provisional requirement model. Examples:

- Does an authentication mechanism already exist?
- Is there an established page or route pattern for unauthenticated users?
- Is an identity provider already configured?
- Are there existing loading, validation, and error-state components?
- Does the product already define where successful authentication redirects?
- Are there security or platform constraints that change the recommended flow?

Only after this provisional model exists may repository inspection begin.

# Exploration brief structure

After targeted validation (Pass A provisional model, then Pass B codebase validation), create a final `EXPLORATION_BRIEF`. This brief is the functional source of truth for the proposal phase.

## Pass B: targeted codebase validation

Inspect the repository only to answer the questions listed under `Questions for codebase validation` in the provisional model.

Use CodeGraph MCP tools first when available. Fall back to targeted grep, find, glob, and file reads when CodeGraph is unavailable or insufficient.

Every repository lookup must answer one of the previously written validation questions. Before each lookup, identify the question it is intended to answer. After each lookup, record one of:

```text
Confirmed:
Contradicted:
Refined:
No relevant evidence:
```

Do not perform broad repository discovery. Do not produce a repository tour, folder inventory, general architecture summary, unrelated dependency audit, complete component catalogue, generic code-quality review, or implementation plan. Do not recursively inspect files merely because they are linked or imported. Follow a reference only when it is necessary to answer one of the validation questions.

Prefer the minimum amount of repository evidence required to determine:

- whether related functionality already exists,
- which established conventions should be followed,
- which existing capabilities can be reused,
- where the feature naturally belongs,
- and whether the repository introduces constraints that materially alter the requirement.

Default budget: no more than eight targeted repository lookups during exploration. Exceed this budget only when existing evidence materially contradicts the provisional requirement model or when a security-critical decision requires additional validation. If the repository is empty, unavailable, incomplete, or unrelated, continue using the requirement model and record the missing evidence. Lack of repository evidence is not automatically a failure.

## Repository evidence cannot redefine the goal

The repository may constrain the implementation, reveal reusable functionality, reveal an existing product convention, expose a technical incompatibility, or alter the recommended approach. The repository must not replace the stated user need with whatever functionality happens to already exist. Do not conclude that the requirement means something merely because the repository contains a similarly named class, page, module, or feature.

The resolved input defines the desired outcome. The codebase provides evidence about fit and feasibility.

## Pass C: the brief template

```markdown
# Exploration Brief: {title}

## 1. User and problem
Identify the actor, their need, and the underlying problem.

## 2. Desired outcome
State the result the feature must create for the user or system.

## 3. Primary user flow
Describe the expected end-to-end behaviour in functional terms.

## 4. Functional scope
List the behaviours included in this change.

## 5. Explicitly out of scope
List adjacent behaviours intentionally excluded.

## 6. Assumptions and autonomous decisions
Document every material ambiguity resolved without user input.

## 7. Acceptance criteria
Provide testable, user-observable criteria.

## 8. Edge cases and failure states
Describe invalid input, partial states, permissions, retries, empty states, loading states, error states, cancellation, concurrency, and recovery where relevant.

## 9. Alternatives and tradeoffs
Describe credible functional alternatives, what each optimizes for, and why the recommended option is preferable.

## 10. Recommended functional approach
Describe what should be built without turning this section into a task list or low-level implementation design.

## 11. Codebase fit
Summarize only the repository evidence that affects the recommendation: existing capabilities to reuse, product or architectural conventions to follow, likely integration boundaries, constraints, and contradictions discovered.

## 12. Risks and unresolved concerns
Record remaining product, security, data, compatibility, operational, or delivery risks.

## 13. Proposal guidance
Give the proposal phase explicit guidance about what the proposal must preserve, what assumptions it must encode, and what it must not expand into.
```

## Exploration quality gate

Before completing the exploration, verify all of the following:

- The user problem is understandable without repository knowledge.
- The desired outcome is explicit.
- The primary flow is defined.
- Scope and out-of-scope decisions are present.
- Material ambiguities have explicit assumptions.
- Acceptance criteria are observable and testable.
- At least one credible alternative was considered when alternatives exist.
- Edge cases are derived from the requirement, not merely from current code.
- Repository evidence appears only as validation or constraint.
- The recommendation follows from the user need.
- The brief would remain useful if the entire `Codebase fit` section were removed.

Exploration has failed and must be redone when any of these is true:

- The exploration begins with a repository or architecture summary.
- The output is primarily a list of files, modules, classes, or dependencies.
- More than roughly one third of the final brief describes the existing codebase.
- Acceptance criteria are primarily implementation tasks.
- The recommendation is simply to copy what already exists.
- The user's actual outcome remains unclear.
- The codebase became the subject instead of supporting evidence.

If the quality gate fails, discard the exploration output and rerun once, beginning again with Pass A and no repository access. If the second attempt still fails, use the Failure policy.

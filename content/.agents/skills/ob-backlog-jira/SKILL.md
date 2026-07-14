---
name: ob-backlog
description: Create a Jira issue from a description. Use when user runs /ops-backlog.
license: MIT
compatibility: Requires acli (Atlassian CLI).
metadata:
  author: copilots
  version: "1.0"
---

**NEVER use browser tools to navigate to atlassian.net: use `acli` CLI only.**

---

### Step 1: Parse input

`$ARGUMENTS` is the issue title/description. If it contains a title and body separated by a newline or `---`, split them. Otherwise use the full text as the title with an empty body.

### Step 2: Create issue

```bash
acli jira issue create \
  --summary "{title}" \
  --description "{body}" \
  --type "Story"
```

### Step 3: Report

```text
Issue created
  Key: {key}
  Title: {title}
  URL: {issue-url}
```

Tell the user: "Use `/plan-propose {issue-url}` to turn this into a plan."

---

## Guardrails

- Use `acli` CLI for all Jira operations
- NEVER use browser tools to navigate to atlassian.net
- Jira is a backlog-only platform: it has no code repos or PRs. PR creation and code review use the repo platform (GitHub or Azure DevOps) configured separately

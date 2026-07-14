---
name: ob-userstory
description: Parse a Jira work item and create an OpenSpec change. Use when the user provides a Jira URL or a bare issue key (e.g. PROJ-123).
license: MIT
compatibility: Requires openspec CLI and Atlassian CLI (acli).
metadata:
  author: copilots
  version: "1.0"
---

**Browser MCP tools are FORBIDDEN for all Jira operations.**

---

## Atlassian CLI Setup (One-Time)

Install from: https://developer.atlassian.com/cloud/acli/guides/install-acli/

Authenticate:
```bash
# Option 1: API token (recommended for CI)
echo <token> | acli jira auth login --site "<yoursite>.atlassian.net" --email "<email>" --token

# Option 2: OAuth (interactive)
acli jira auth login --web
```

Generate API token at: https://id.atlassian.com/manage-profile/security/api-tokens

---

## Steps

1. **Extract Issue Key** from URL
   - `https://yoursite.atlassian.net/browse/PROJ-123` → Key: PROJ-123
   - `https://yoursite.atlassian.net/jira/core/projects/PROJ/issues/PROJ-123` → Key: PROJ-123
   - `https://yoursite.atlassian.net/browse/PROJ-123?filter=123` → Key: PROJ-123
   - If the user provides just `PROJ-123` without a URL, use it directly as the key.

2. **Fetch Work Item**
   ```bash
   acli jira workitem view --key "PROJ-123"
   ```

   Parse the output for:
   - **Summary** → title
   - **Description** → proposal context
   - **Acceptance Criteria** (if present in description or custom fields) → spec requirements
   - **Labels** → tags for the OpenSpec change
   - **Status** → current state (e.g. To Do, In Progress, Done)
   - **Assignee** → who requested it
   - **Priority** → complexity hint

3. **Offer to transition the Work Item to In Progress**

   This writes to Jira, so ask first: "Move {KEY} to In Progress? [yes/no]". Only if the user confirms AND the status is currently "To Do" or "Backlog":
   ```bash
   acli jira workitem transition --key "PROJ-123" --status "In Progress"
   ```
   In unattended runs (`/plan-goal`), skip the question and the transition entirely.

4. **Create OpenSpec Change**
   ```bash
   openspec new change "{slug-from-summary}"
   ```

   Write `proposal.md` with:
   - **Title**: the Jira issue summary
   - **Context**: mention this is Jira issue `{KEY}`, link back to the URL
   - **Requirements**: extracted from description + acceptance criteria
   - **Scope**: what's in/out based on the issue

5. **Report**
   Tell the user:
   - Jira issue `{KEY}` fetched: {summary}
   - OpenSpec change created: {change-name}
   - Work item transition: {done / skipped}

After reporting, the lead MUST run `/plan-propose` to generate the proposal, specs, and tasks. After `/plan-propose` completes, STOP and ask the user: **"Ready to implement? (yes/no)"** — do NOT proceed to `/plan-apply` until confirmed.

---

## Jira URL Patterns

| URL format | Example |
|------------|---------|
| Browse URL | `https://yoursite.atlassian.net/browse/PROJ-123` |
| Issue URL  | `https://yoursite.atlassian.net/jira/core/projects/PROJ/issues/PROJ-123` |
| Board URL  | `https://yoursite.atlassian.net/jira/software/c/projects/PROJ/boards/1?selectedIssue=PROJ-123` |
| Direct key | `PROJ-123` |

---

## Useful Commands

```bash
# View work item
acli jira workitem view --key "PROJ-123"

# Transition work item
acli jira workitem transition --key "PROJ-123" --status "In Progress"
acli jira workitem transition --key "PROJ-123" --status "Done"

# Search with JQL
acli jira workitem search --jql "project = PROJ AND status = 'To Do' ORDER BY priority DESC"

# Add a comment
acli jira workitem comment create --key "PROJ-123" --body "Implementation started"
```

---

## Rules

- NEVER use browser tools to navigate to atlassian.net — use `acli` CLI only
- NEVER output API tokens or credentials
- The Jira issue key format is `PROJECT-NUMBER` (e.g. `PROJ-123`)
- If `acli` is not installed, report a blocker and tell the user to install from https://developer.atlassian.com/cloud/acli/guides/install-acli/
- If not authenticated, tell the user to run `acli jira auth login`
- Jira is a backlog-only platform — it has no code repos or PRs. PR creation and code review use the repo platform (GitHub or Azure DevOps) configured separately

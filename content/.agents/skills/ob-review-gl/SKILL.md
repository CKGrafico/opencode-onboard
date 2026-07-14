---
name: ob-review
description: Read and triage GitLab MR review feedback. Use when user says "I've added comments to the MR" or runs /ops-review.
license: MIT
compatibility: Requires glab CLI and openspec CLI.
metadata:
  author: copilots
  version: "1.0"
---

**ALL GitLab data MUST come from `glab` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitLab operations, even if glab CLI fails. If `glab` is unavailable, report as a blocker.**
Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.

---

### Step 1: Parse MR URL or number

- `https://gitlab.com/{owner}/{repo}/-/merge_requests/123` → MR !123, repo: `{owner}/{repo}`
- `https://gitlab.com/{owner}/{repo}/-/merge_requests/123#note_456` → MR !123, note: 456
- `!123` → MR !123

### Step 2: Fetch MR details and comments

```bash
glab mr view {number} --repo {owner}/{repo}
glab mr note list {number} --repo {owner}/{repo}
```

Also fetch MR threads (inline code comments):

```bash
glab api "projects/:id/merge_requests/{number}/discussions"
```

### Step 3: Classify comments

Categorize each comment as:
- **BLOCKER**: must fix before merge (test failures, security issues, broken logic)
- **IMPORTANT**: should fix (missing edge case, code quality, performance)
- **SUGGESTION**: nice to have (style, refactor, docs)
- **QUESTION**: needs clarification (respond or discuss)
- **RESOLVED**: already addressed or invalid

### Step 4: Report

Display a structured summary:

```text
MR Feedback Summary: !{number}

  Blockers: {count}
    [B1] {comment-author}: {comment-summary}
  Important: {count}
    [I1] {comment-author}: {comment-summary}
  Suggestions: {count}
    [S1] {comment-author}: {comment-summary}
  Questions: {count}
    [Q1] {comment-author}: {comment-summary}

Next: Run /plan-apply to fix blockers and important items.
```

### Step 5: Do NOT implement fixes

This mode only triages. Fixing is done via `/plan-apply`. Tell the user what needs fixing, then stop.

---

## Guardrails

- NEVER use browser tools to navigate to gitlab.com: use `glab` CLI only
- NEVER output API tokens or credentials
- NEVER merge MRs: human-only action
- GitLab uses "merge requests" (MR) not "pull requests" (PR): use GitLab terminology

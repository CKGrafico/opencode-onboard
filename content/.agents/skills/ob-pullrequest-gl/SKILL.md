---
name: ob-pullrequest
description: Create GitLab merge requests with screenshots, or read and triage MR review feedback. Use when shipping a feature branch or when user says "I've added comments to the MR".
license: MIT
compatibility: Requires glab CLI, openspec CLI, and opencode-browser for screenshots.
metadata:
  author: copilots
  version: "1.0"
---

**ALL GitLab data MUST come from `glab` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitLab operations, even if glab CLI fails. If `glab` is unavailable, report as a blocker.**
Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.

---

## Mode A: Create Merge Request (ship mode)

Triggered when the lead runs `/pull-request`.

### Step 1: Verify feature branch

```bash
BRANCH="$(git branch --show-current)"
DEFAULT_BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')"
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"
```

`$BRANCH` must be a work branch (`feature/*` or `bugfix/*` — `/apply-plan` creates `feature/{change-slug}`). NEVER push the default branch.

### Step 2: Capture screenshots (if UI changes exist)

```bash
browser_navigate url="http://localhost:{port}/{route}"
browser_wait ms=2000
browser_screenshot
```

Save to: `openspec/changes/{change-name}/images/{feature}.png`

### Step 3: Commit and push

`/apply-plan` already committed each task group — usually only screenshots or small residuals remain. Stage **specific paths only** (never `git add -A`, it sweeps unrelated files into the ship commit):

```bash
git add openspec/changes/{change-name}/images/  # plus any other paths you actually changed
git commit -m "{change}: {summary}"   # only if there is something to commit
git push -u origin "$BRANCH"
```

### Step 4: Upload screenshots (if any)

If screenshots exist, upload them so they can be referenced in the MR description:

```bash
glab api --method POST "projects/:id/uploads" -f "file=@openspec/changes/{change-name}/images/{feature}.png"
```

(`:id` is glab's placeholder for the current project — this is the one sanctioned use of git context in this skill.)

Parse the returned `markdown` field — use it to embed the image in the MR description. If the upload fails (the endpoint needs multipart form data and `-f` support varies by glab version), fall back to referencing the image committed on the branch instead.

If no UI changes, skip this step.

### Step 5: Create Merge Request

```bash
glab mr create \
  --source-branch "$BRANCH" \
  --target-branch "$DEFAULT_BRANCH" \
  --title "{title}" \
  --description "Closes {issue-link}

## Summary
{summary from proposal.md}

## Changes
{key changes from tasks.md}

## Test plan
- [ ] {checklist of manual verification steps}
{screenshots if available}" \
  --remove-source-branch \
  --squash-before-merge
```

Do NOT use `--yes` unless running in autopilot/non-interactive mode.

### Step 6: Report

Display:

```text
Merge Request created
  MR: {mr-url}
  Title: {title}
  Source: {branch}
  Target: {default-branch}
```

---

## Mode B: Process MR Feedback (feedback mode)

Triggered when user says "I've added comments to the MR" or provides a GitLab MR URL.

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
- **BLOCKER** — must fix before merge (test failures, security issues, broken logic)
- **IMPORTANT** — should fix (missing edge case, code quality, performance)
- **SUGGESTION** — nice to have (style, refactor, docs)
- **QUESTION** — needs clarification (respond or discuss)
- **RESOLVED** — already addressed or invalid

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

Next: Run /apply-plan to fix blockers and important items.
```

### Step 5: Do NOT implement fixes

This mode only triages. Fixing is done via `/apply-plan`. Tell the user what needs fixing, then stop.

---

## Useful Commands

```bash
# List merge requests
glab mr list --repo {owner}/{repo} --merged
glab mr list --repo {owner}/{repo} --opened

# View a merge request
glab mr view {number} --repo {owner}/{repo}

# Read MR comments
glab mr note list {number} --repo {owner}/{repo}

# Read MR discussions (inline code comments)
glab api "projects/:id/merge_requests/{number}/discussions"

# Reply to a comment
glab mr note create {number} --repo {owner}/{repo} -m "Reply text"
```

---

## Rules

- NEVER use browser tools to navigate to gitlab.com — use `glab` CLI only
- NEVER output API tokens or credentials
- NEVER merge MRs — human-only action
- NEVER use `--yes` flag in interactive mode (only in autopilot)
- If `glab` is not installed, report a blocker and tell the user to install from https://gitlab.com/gitlab-org/cli/#installation
- If not authenticated, tell the user to run `glab auth login`
- GitLab uses "merge requests" (MR) not "pull requests" (PR) — use GitLab terminology
- GitLab is a repo-only platform — it has no backlog/work item integration. Backlog operations use the backlog platform (GitHub / Azure / Jira) configured separately

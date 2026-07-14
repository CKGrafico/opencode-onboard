---
name: ob-pullrequest
description: Create GitHub PRs with screenshots, or read and triage PR review feedback. Use when shipping a feature branch or when user says "I've added comments to the PR".
license: MIT
compatibility: Requires gh CLI, openspec CLI, and opencode-browser for screenshots.
metadata:
  author: copilots
  version: "1.0"
---

**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitHub operations, even if gh CLI fails. If `gh` is unavailable, report as a blocker.**
Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.

---

## Mode A: Create PR (ship mode)

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

`/apply-plan` already committed each task group — usually only screenshots or small residuals remain. Stage **specific paths only** (never `git add .`, it sweeps unrelated files into the ship commit):

```bash
git add openspec/changes/{change-name}/images/  # plus any other paths you actually changed
git commit -m "feat({scope}): {description} (#{id})"   # only if there is something to commit
git push -u origin "$BRANCH"
```

### Step 4: Create PR

```bash
gh pr create \
  --repo {owner}/{repo} \
  --base "$DEFAULT_BRANCH" \
  --head "$BRANCH" \
  --title "feat({scope}): {title} (#{id})" \
  --body "{description}"
```

### Step 5: Post screenshot comment

Resolve commit SHA (the commit that includes screenshots):

```bash
git rev-parse HEAD
```

Build blob URL for each image with `?raw=true` (a plain blob URL renders the GitHub HTML page, not the image, inside `![...]()`):

```
https://github.com/{owner}/{repo}/blob/{sha}/openspec/changes/{change}/images/{file}.png?raw=true
```

Note: on private repos the embedded image is only visible to users with repo access.

Post comment:

```bash
gh pr comment {pr-number} --repo {owner}/{repo} --body $'## Screenshots\n\n![{feature}]({blob-url})'
```

---

## Mode B: Read PR Feedback (feedback mode)

Triggered when user says "I've added comments to the PR" or "check PR feedback".

### Step 1: Find PRs

If PR link provided, extract number from URL. Otherwise:

```bash
gh pr list --repo {owner}/{repo} --state open --limit 1
```

### Step 2: Read comment threads

```bash
gh pr view {pr-number} --repo {owner}/{repo} --comments
# Or structured output:
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments
gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews
```

### Step 3: Categorize feedback

| Category      | Description                         | Action                              |
| ------------- | ----------------------------------- | ----------------------------------- |
| `code-change` | Reviewer requests code modification | Return to lead to spawn specialists |
| `spec-update` | Affects proposal, design, or tasks  | Update openspec artifacts           |
| `question`    | Reviewer asks a question            | Reply with answer                   |
| `resolved`    | Thread already resolved             | Skip                                |

### Step 4: Update openspec (if spec-update)

```bash
git branch --show-current
# feature/add-user-auth → change: add-user-auth
```

Update: `openspec/changes/{change}/proposal.md`, `design.md`, or `tasks.md` as appropriate.

### Step 5: Reply to each comment thread

```bash
# Reply to a review comment
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments/{comment-id}/replies \
  --method POST \
  --field body="Acknowledged, applying this change now."

# Or post a general PR comment
gh pr comment {pr-number} --body "Updated design.md to reflect feedback."
```

---

## Guardrails

- ✅ Commit and push to feature branches only
- ✅ Create and comment on PRs via gh CLI with explicit `--repo {owner}/{repo}`
- ✅ Screenshots of localhost only via browser_screenshot
- ❌ Commit or push to `main`, FORBIDDEN
- ❌ Force push, FORBIDDEN
- ❌ Merge or approve PRs, human-only
- ❌ Navigate browser to github.com, FORBIDDEN
- ❌ webfetch or HTTP requests to GitHub URLs, FORBIDDEN

---
name: ob-pullrequest-gh
description: Create GitHub PRs with screenshots, or read and triage PR review feedback. Use when shipping a feature branch or when user says "I've added comments to the PR".
license: MIT
compatibility: Requires gh CLI, openspec CLI, and opencode-browser for screenshots.
metadata:
  author: copilots
  version: "1.0"
---

**RTK - MANDATORY**

Use `rtk` wrapper for ALL CLI commands:
- `rtk git add` NOT `git add`
- `rtk git commit` NOT `git commit`
- `rtk git push` NOT `git push`
- `rtk gh pr create` NOT `gh pr create`
- `rtk gh pr comment` NOT `gh pr comment`
- `rtk gh api` NOT `gh api`

**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitHub operations, even if gh CLI fails. If `gh` is unavailable, report as a blocker.**
Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.

---

## Mode A: Create PR (ship mode)

Triggered when devops-manager is in ship mode after implementation is complete.

### Step 1: Verify feature branch

```bash
rtk git branch --show-current
```

Branch must be `feature/{id}-{slug}`. NEVER push to `main`.

### Step 2: Capture screenshots (if UI changes exist)

```bash
browser_navigate url="http://localhost:{port}/{route}"
browser_wait ms=2000
browser_screenshot
```

Save to: `openspec/changes/{change-name}/images/{feature}.png`

### Step 3: Commit and push

```bash
rtk git add .
rtk git commit -m "feat(#{id}): {description}"
rtk git push origin feature/{slug}
```

### Step 4: Create PR

```bash
rtk gh pr create \
  --base main \
  --head feature/{slug} \
  --title "feat: {title}" \
  --body "{description}"
```

### Step 5: Post screenshot comment

Build raw URL for each image:
```
https://raw.githubusercontent.com/{owner}/{repo}/feature/{slug}/openspec/changes/{change}/images/{file}.png
```

Post comment:
```bash
rtk gh pr comment {pr-number} --body $'## Screenshots\n\n![{feature}]({raw-url})'
```

---

## Mode B: Read PR Feedback (feedback mode)

Triggered when user says "I've added comments to the PR" or "check PR feedback".

### Step 1: Find PRs

If PR link provided, extract number from URL. Otherwise:
```bash
rtk gh pr list --repo {owner}/{repo} --state open --limit 1
```

### Step 2: Read comment threads

```bash
rtk gh pr view {pr-number} --repo {owner}/{repo} --comments
# Or structured output:
rtk gh api repos/{owner}/{repo}/pulls/{pr-number}/comments
rtk gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews
```

### Step 3: Categorize feedback

| Category | Description | Action |
|----------|-------------|--------|
| `code-change` | Reviewer requests code modification | Return to lead to spawn specialists |
| `spec-update` | Affects proposal, design, or tasks | Update openspec artifacts |
| `question` | Reviewer asks a question | Reply with answer |
| `resolved` | Thread already resolved | Skip |

### Step 4: Update openspec (if spec-update)

```bash
rtk git branch --show-current
# feature/add-user-auth → change: add-user-auth
```

Update: `openspec/changes/{change}/proposal.md`, `design.md`, or `tasks.md` as appropriate.

### Step 5: Reply to each comment thread

```bash
# Reply to a review comment
rtk gh api repos/{owner}/{repo}/pulls/{pr-number}/comments/{comment-id}/replies \
  --method POST \
  --field body="Acknowledged, applying this change now."

# Or post a general PR comment
rtk gh pr comment {pr-number} --body "Updated design.md to reflect feedback."
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

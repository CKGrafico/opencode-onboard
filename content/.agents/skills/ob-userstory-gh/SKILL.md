---
name: ob-userstory-gh
description: Parse GitHub Issue URL and create OpenSpec change. Use when user provides a GitHub Issue URL.
license: MIT
compatibility: Requires openspec CLI and gh CLI.
metadata:
  author: copilots
  version: "1.0"
---

**Browser MCP tools are FORBIDDEN for all GitHub operations.**

---

## GitHub CLI Setup (One-Time)

```bash
gh auth login
# Follow prompts, authenticate via browser or token
```

Verify:
```bash
gh auth status
```

---

## Steps

1. **Extract Issue Number** from URL
   - `https://github.com/{owner}/{repo}/issues/42` → number: 42

2. **Fetch Issue**
   ```bash
   gh issue view 42 --json number,title,body,labels,milestone,state
   ```

3. **Extract Key Fields** from JSON response:
   - `number` → Issue number
   - `title` → Title
   - `body` → Description / acceptance criteria
   - `labels` → Labels
   - `milestone` → Milestone / sprint equivalent
   - `state` → State (open/closed)

4. **Create OpenSpec Change**
   ```bash
   openspec new change "gh-{number}-{slug}"
   ```

---

## Full GitHub CLI Reference

Use these for ALL GitHub operations, browser MCP is FORBIDDEN.

### Issues
```bash
# Read issue
gh issue view <number>

# List open issues
gh issue list --state open --limit 10

# Update issue
gh issue edit <number> --add-label "in-progress"
```

### Pull Requests
```bash
# List open PRs
gh pr list --state open

# Show PR details
gh pr view <number>

# Create PR
gh pr create \
  --base main \
  --head feature/{slug} \
  --title "feat: <title>" \
  --body "<description>"

# Update PR
gh pr edit <number> --body "<text>"
```

### PR Comments
```bash
# Read PR comments
gh pr view <number> --comments

# Post PR comment
gh pr comment <number> --body "Your markdown comment here."

# Reply to review comment via API
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments/{comment-id}/replies \
  --method POST \
  --field body="Reply text here."
```

### Review Comments (structured)
```bash
# Get all review comments on a PR
gh api repos/{owner}/{repo}/pulls/{pr-number}/comments

# Get all reviews
gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews
```

---

## Screenshot / Image Strategy

**Never embed images as attachments.** Save to openspec change folder and reference via raw GitHub URL.

### Save location
```
openspec/changes/{change-name}/images/{screenshot}.png
```

### Raw URL format (renders inline in PR comments)
```
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/openspec/changes/{change}/images/{file}.png
```

### PR comment with screenshot
```bash
gh pr comment <number> --body "## Screenshots\n\n![Description](https://raw.githubusercontent.com/{owner}/{repo}/feature/{slug}/openspec/changes/{change}/images/{file}.png)"
```

---

## URL Formats Reference

```
# Issue
https://github.com/{owner}/{repo}/issues/{number}

# PR
https://github.com/{owner}/{repo}/pull/{number}

# Raw file
https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
```

---

## Output Format

```
## Issue Parsed

**Issue:** #{number}
**Title:** {title}
**State:** {state}
**Milestone:** {milestone}

**Change Created:** gh-{number}-{slug}

### Next Steps
1. Review the proposal
2. Say "implement the plan" to start implementation
```

## Constraints

- This skill only PARSES and PROPOSES, implementation via openspec-apply-change
- Always use `gh` CLI for GitHub operations
- Browser MCP tools FORBIDDEN for all GitHub operations

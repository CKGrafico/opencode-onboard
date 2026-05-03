---
name: ob-userstory-gh
description: Parse GitHub Issue URL and create OpenSpec change. Use when user provides a GitHub Issue URL.
license: MIT
compatibility: Requires openspec CLI and gh CLI.
metadata:
  author: copilots
  version: "1.1"
---

**RTK - MANDATORY**

Use `rtk` wrapper for ALL CLI commands:
- `rtk gh issue view` NOT `gh issue view`
- `rtk gh issue list` NOT `gh issue list`
- `rtk gh issue edit` NOT `gh issue edit`
- `rtk openspec new change` NOT `openspec new change`

**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools to fetch GitHub URLs, even if gh CLI fails. If `gh` is unavailable, report it as a blocker.**

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

1. **Extract owner, repo, and issue number** from URL
   - `https://github.com/{owner}/{repo}/issues/42` → owner: `{owner}`, repo: `{repo}`, number: `42`

2. **Fetch Issue**, always pass `--repo` explicitly, never rely on git context:
   ```bash
   rtk gh issue view 42 --repo {owner}/{repo} --json number,title,body,labels,milestone,state
   ```
   If this returns an auth error or 404, report as a blocker, do NOT fall back to webfetch or web search.

3. **Extract Key Fields** from JSON response:
   - `number` → Issue number
   - `title` → Title
   - `body` → Description / acceptance criteria
   - `labels` → Labels
   - `milestone` → Milestone / sprint equivalent
   - `state` → State (open/closed)

4. **Create OpenSpec Change**
   ```bash
   rtk openspec new change "gh-{number}-{slug}"
   ```

---

## Full GitHub CLI Reference

Use these for ALL GitHub operations, browser MCP and webfetch are FORBIDDEN. Always pass `--repo {owner}/{repo}`, never rely on git context.

### Issues
```bash
# Read issue
rtk gh issue view <number> --repo {owner}/{repo}

# List open issues
rtk gh issue list --repo {owner}/{repo} --state open --limit 10

# Update issue
rtk gh issue edit <number> --repo {owner}/{repo} --add-label "in-progress"
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
```

After outputting the above, the lead MUST run `/opsx-propose` to generate the proposal, specs, and tasks. After `/opsx-propose` completes, STOP and ask the user: **"Ready to implement? (yes/no)"**, do NOT proceed to `/opsx-apply` until confirmed.

---

## Guardrails

- ✅ Parse GitHub Issue URL and create OpenSpec change
- ✅ Use `rtk gh` for all GitHub CLI operations
- ✅ Always run `/opsx-propose` after parsing, never skip to implementation
- ✅ Always stop and confirm with user after propose, before running `/opsx-apply`
- ❌ `webfetch` or HTTP requests to GitHub URLs, FORBIDDEN, use `gh` CLI only
- ❌ Browser MCP tools for GitHub operations, FORBIDDEN
- ❌ Jump to implementation without user confirmation, FORBIDDEN

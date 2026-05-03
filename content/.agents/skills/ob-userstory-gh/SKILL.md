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
   rtk gh issue view 42 --json number,title,body,labels,milestone,state
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
   rtk openspec new change "gh-{number}-{slug}"
   ```

---

## Full GitHub CLI Reference

Use these for ALL GitHub operations, browser MCP is FORBIDDEN.

### Issues
```bash
# Read issue
rtk gh issue view <number>

# List open issues
rtk gh issue list --state open --limit 10

# Update issue
rtk gh issue edit <number> --add-label "in-progress"
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

### Next Steps
1. Review the proposal
2. Say "implement the plan" to start implementation
```

---

## Guardrails

- ✅ Parse GitHub Issue URL and create OpenSpec change
- ✅ Use `rtk gh` for all GitHub CLI operations
- ❌ Browser MCP tools for GitHub operations, FORBIDDEN
- ❌ Implementation, this skill only parses and proposes

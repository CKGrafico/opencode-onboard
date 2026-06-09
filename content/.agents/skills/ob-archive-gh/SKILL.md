---
name: ob-archive-gh
description: Archive GitHub PR artifacts after merge. Use when a PR has been merged and needs to be archived.
license: MIT
compatibility: Requires gh CLI, openspec CLI.
---

**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitHub operations, even if gh CLI fails. If `gh` is unavailable, report as a blocker.**
Always pass `--repo {owner}/{repo}` explicitly, never rely on git context to resolve the repo.

---

### Step 1: Find PR and verify merged

```bash
gh pr list \
  --repo {owner}/{repo} \
  --head feature/{id}-{slug} \
  --state closed
```

- If a matching PR is found, verify that its status is "completed" (merged).
- If no matching PR is found, or if the PR is not merged, report as a blocker and do not proceed with archiving.

### Step 2: Verify and update AI files

```bash
/opsx-verify us-{id}-{slug} # or /opsx-validate us-{id}-{slug}
/opsx-archive us-{id}-{slug}
```

### Step 3: Update ARCHITECTURE and DESIGN files

- Review ARCHITECTURE.md and DESIGN.md and find discrepancies compared to the change implementation. Discrepancies include any new architectural decisions, design changes, or implementation details that are not yet captured in the documentation.
- Make sure all discrepancies are properly documented in ARCHITECTURE.md and DESIGN.md, so the documentation is up to date with the change implementation.
- Updates to ARCHITECTURE.md and DESIGN.md should be treated as conflicts, so the user must explicitly consent to the changes before they are applied. This ensures that the user reviews and approves all documentation updates related to the change.
- Let the user know the discrepancies found and the proposed updates to ARCHITECTURE.md and DESIGN.md, and ask for their consent before applying the changes. If the user does not consent, do not apply the updates to the documentation.
- Only review implementation for this specific change, do not review or update documentation for any other unrelated changes that may be present in the codebase. The focus should be solely on ensuring that the documentation accurately reflects the implementation of the specific change being archived.

### Step 4: Create archive PR

```bash
gh pr create \
  --repo {owner}/{repo} \
  --base main \
  --head archive/{id}-{slug} \
  --title "archive(#{id}): {title}" \
  --body "Archive SDD artifacts for {id} after merge."
```

---

## Guardrails

- ✅ Commit and push to archive branches only
- ✅ Create and comment on PRs via gh CLI with explicit `--repo {owner}/{repo}`
- ❌ Commit or push to `main`, FORBIDDEN
- ❌ Force push, FORBIDDEN
- ❌ Merge or approve PRs, human-only
- ❌ Navigate browser to github.com, FORBIDDEN
- ❌ webfetch or HTTP requests to GitHub URLs, FORBIDDEN

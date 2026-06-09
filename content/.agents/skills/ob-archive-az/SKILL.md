---
name: ob-archive-az
description: Archive Azure DevOps PR artifacts and update documentation after merge. Use when a PR has been merged and needs to be archived.
license: MIT
compatibility: Requires az CLI, az devops extension, openspec CLI.
---

**ALL Azure DevOps data MUST come from `az` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for Azure DevOps operations, even if az CLI fails. If `az` is unavailable, report as a blocker.**
Always pass `--repository {repo}` explicitly, never rely on git context to resolve the repo.

---

### Step 1: Find PR and verify merged

```bash
az repos pr list \
  --repository {repo} \
  --source-branch feature/{id}-{slug} \
  --status completed
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
az repos pr create \
  --repository {repo} \
  --source-branch archive/{id}-{slug} \
  --target-branch main \
  --title "archive(#{id}): {title}" \
  --description "Archive SDD artifacts for {id} after merge."
```

---

## Guardrails

- ✅ Commit and push to archive branches only
- ✅ Create and comment on PRs via az CLI with explicit `--repository {repo}`
- ❌ Commit or push to `main`, FORBIDDEN
- ❌ Force push, FORBIDDEN
- ❌ Merge or approve PRs, human-only
- ❌ Navigate browser to dev.azure.com, FORBIDDEN

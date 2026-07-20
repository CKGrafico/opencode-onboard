**Browser MCP tools are FORBIDDEN for all Azure DevOps operations. Use `az boards` CLI only. If `az` is unavailable, skip publishing (report it) — do not fail the pipeline unless the caller declared publishing a ship gate.**

Publish only a `passed` (or text-only) manifest. A `blocked`/`failed` manifest is surfaced, not published as success.

### Step 1 — Image hosting caveat

Azure DevOps discussion comments do not render an image from a repo blob URL the way GitHub does, and `az boards` cannot upload an attachment inline. Use **text evidence** and link the committed asset path so a reviewer can open it in the repo. Include a raw URL only if your repo host serves one that Azure markdown renders.

```
Screenshot committed at: {asset-path} (branch {branch}, commit {sha})
```

### Step 2 — Build the comment with a stable marker (idempotent)

```
<!-- ob-visual-evidence:{change-id} -->

{prMarkdown}

{image-line?}
```

### Step 3 — Upsert the discussion comment on the work item (and the PR when provided)

`az boards work-item update --discussion` appends a comment; to stay idempotent, first read existing discussion comments and skip if one already carries the marker for this change id, otherwise post:

```bash
# best-effort existing-comment check via the work-item comments API
az boards work-item show --id {work-item-id} --query 'fields."System.History"' -o tsv 2>/dev/null | grep -q "ob-visual-evidence:{change-id}" \
  || az boards work-item update --id {work-item-id} --discussion "$BODY"
```

When a PR number is provided, also add the same body as a PR thread comment (`az repos pr` thread APIs) if available.

- If a comment call fails: report it. Fail the run ONLY when publishing was declared a ship gate; otherwise continue.

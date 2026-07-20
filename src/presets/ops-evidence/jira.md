**NEVER use browser tools to navigate to atlassian.net: use `acli` CLI only. If `acli` is unavailable, skip publishing (report it) — do not fail the pipeline unless the caller declared publishing a ship gate.**

Publish only a `passed` (or text-only) manifest. A `blocked`/`failed` manifest is surfaced, not published as success.

### Step 1 — Image hosting caveat

Jira comments cannot embed an image from a repo blob URL, and `acli` does not upload attachments inline. Use **text evidence** and link the committed asset path so a reviewer can open it in the repo:

```
Screenshot committed at: {asset-path} (branch {branch}, commit {sha})
```

### Step 2 — Build the comment with a stable marker (idempotent)

```
<!-- ob-visual-evidence:{change-id} -->

{prMarkdown}

{image-line?}
```

### Step 3 — Upsert the comment on the issue

Keep it idempotent: list existing comments and skip if one already carries the marker for this change id, otherwise add:

```bash
acli jira issue comment list --key {issue-key} 2>/dev/null | grep -q "ob-visual-evidence:{change-id}" \
  || acli jira issue comment --key {issue-key} --body "$BODY"
```

- If the comment command fails: report it. Fail the run ONLY when publishing was declared a ship gate; otherwise continue.

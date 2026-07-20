**Browser MCP tools are FORBIDDEN for all Azure DevOps operations. Use `az boards` CLI only. If `az` is unavailable, skip the comment (evidence is non-fatal) and report it.**

### Image hosting caveat

Azure DevOps work-item discussion comments do not render images from a repo blob URL the way GitHub does, and `az boards` cannot upload an attachment. Prefer **text evidence** in the discussion, and link to the committed image path so a reviewer can open it in the repo:

```
Screenshot committed at: openspec/changes/{change-path}/images/{file}.png (branch {branch}, commit {sha})
```

Only include a rendered image if the repo host provides a raw URL that Azure DevOps markdown will display; otherwise link the path as text.

### Post the comment (discussion)

```bash
az boards work-item update \
  --id {work-item-id} \
  --discussion "## Evidence — {title}"$'\n\n'"{summary}"$'\n\n'"{image-line}"
```

- `{summary}` = tasks N/N, verification result, commit list.
- `{image-line}` = the "Screenshot committed at: …" path line when a screenshot exists; omit otherwise.
- If `az boards work-item update` fails: log it and continue. Never fail the pipeline over a comment.

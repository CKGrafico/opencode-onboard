**NEVER use browser tools to navigate to atlassian.net: use `acli` CLI only. If `acli` is unavailable, skip the comment (evidence is non-fatal) and report it.**

### Image hosting caveat

Jira comments cannot embed an image from a repo blob URL, and `acli` does not upload attachments inline. Use **text evidence** and link to the committed image path in the repo so a reviewer can open it there:

```
Screenshot committed at: openspec/changes/{change-path}/images/{file}.png (branch {branch}, commit {sha})
```

### Post the comment

```bash
acli jira issue comment {issue-key} --body "## Evidence — {title}"$'\n\n'"{summary}"$'\n\n'"{image-line}"
```

- `{summary}` = tasks N/N, verification result, commit list.
- `{image-line}` = the "Screenshot committed at: …" path line when a screenshot exists; omit otherwise.
- If the comment command fails: log it and continue. Never fail the pipeline over a comment.

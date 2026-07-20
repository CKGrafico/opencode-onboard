**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitHub operations. If `gh` is unavailable, skip the comment (evidence is non-fatal) and report it.**
Always pass `--repo {owner}/{repo}` explicitly.

### Build the image URL (only if the branch was pushed)

An image embedded in an issue comment must be a blob URL pinned to a pushed commit SHA, with `?raw=true` (a plain blob URL renders the GitHub HTML page, not the image, inside `![...]()`):

```bash
SHA="$(git rev-parse HEAD)"   # the commit that includes the image, already pushed
```

```
https://github.com/{owner}/{repo}/blob/{SHA}/openspec/changes/{change-path}/images/{file}.png?raw=true
```

Note: on private repos the embedded image is only visible to users with repo access.

### Post the comment

```bash
gh issue comment {issue-number} --repo {owner}/{repo} --body $'## Evidence — {title}\n\n{summary}\n\n![{feature}]({blob-url})'
```

- With a resolvable image: include the `![...]({blob-url})` line.
- No image or `default` mode (nothing pushed): drop the image line, post `{summary}` (tasks N/N, verification result, commits) only.
- If `gh issue comment` fails: log it and continue. Never fail the pipeline over a comment.

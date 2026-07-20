**ALL GitHub data MUST come from `gh` CLI. NEVER use webfetch, HTTP requests, or browser MCP tools for GitHub. If `gh` is unavailable, skip publishing (report it) — do not fail the pipeline over it unless the caller declared publishing a ship gate.**
Always pass `--repo {owner}/{repo}` (or `repos/{owner}/{repo}` for `gh api`) explicitly.

Publish only a `passed` (or text-only) manifest. A `blocked`/`failed` manifest is surfaced, not published as success.

### Step 1 — Verify each asset exists on the remote (only for embedded images)

An embedded image must be a raw URL pinned to the commit that actually contains it, and that commit must be pushed. For each asset in `evidence.json`:

```bash
SHA="$(git log -n 1 --format=%H -- '{asset-path}')"          # the commit that added this asset
[ -z "$SHA" ] && echo "asset not committed: {asset-path}" && exit-skip
gh api "repos/{owner}/{repo}/contents/{asset-path}?ref=$SHA" --silent   # 404 → not pushed yet → skip embedding
```

Raw URL: `https://raw.githubusercontent.com/{owner}/{repo}/{SHA}/{asset-path}` (private repos: visible only to users with repo access). If verification fails, fall back to a text-only comment; never post a dead image link.

### Step 2 — Build the comment body with a stable marker (idempotent)

Prefix the body with a hidden marker so re-runs update the same comment instead of piling on:

```
<!-- ob-visual-evidence:{change-id} -->

{prMarkdown}
```

### Step 3 — Upsert the comment on BOTH the issue and the PR

For each target number (the originating issue, and the PR number when provided), find an existing marked comment and PATCH it, else POST a new one:

```bash
# find existing
ID="$(gh api "repos/{owner}/{repo}/issues/{number}/comments" --paginate --jq \
  '.[] | select(.body | contains("<!-- ob-visual-evidence:{change-id} -->")) | .id' | head -1)"

if [ -n "$ID" ]; then
  gh api --method PATCH "repos/{owner}/{repo}/issues/comments/$ID" -f body="$BODY" --silent
else
  gh api --method POST  "repos/{owner}/{repo}/issues/{number}/comments" -f body="$BODY" --silent
fi
```

- Text-only (no verified image, or `default` mode / nothing pushed): drop the image lines, keep the summary (tasks N/N, verification result, commits).
- If a comment call fails: report it. Fail the run ONLY when the caller declared publishing a ship gate; otherwise continue.

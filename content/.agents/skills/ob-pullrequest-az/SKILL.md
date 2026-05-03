---
name: ob-pullrequest-az
description: Create Azure DevOps PRs with screenshots, or read and triage PR review feedback. Use when shipping a feature branch or when user says "I've added comments to the PR".
license: MIT
compatibility: Requires az CLI, az devops extension, openspec CLI, and opencode-browser for screenshots.
metadata:
  author: copilots
  version: "1.0"
---

**RTK - MANDATORY**

Use `rtk` wrapper for ALL CLI commands:
- `rtk git add` NOT `git add`
- `rtk git commit` NOT `git commit`
- `rtk git push` NOT `git push`
- `rtk az repos pr create` NOT `az repos pr create`
- `rtk az repos pr work-item add` NOT `az repos pr work-item add`
- `rtk az devops invoke` NOT `az devops invoke`

**Browser MCP tools are FORBIDDEN for all Azure DevOps operations.**
Browser tools are ONLY permitted for screenshots of the LOCAL running app on `localhost` URLs.

---

## Mode A: Create PR (ship mode)

Triggered when devops-manager is in ship mode after implementation is complete.

### Step 1: Verify feature branch

```bash
rtk git branch --show-current
```

Branch must be `feature/{id}-{slug}`. NEVER push to `main`.

### Step 2: Capture screenshots (if UI changes exist)

```bash
browser_navigate url="http://localhost:{port}/{route}"
browser_wait ms=2000
browser_screenshot
```

Save to: `openspec/changes/{change-name}/images/{feature}.png`

### Step 3: Commit and push

```bash
rtk git add .
rtk git commit -m "feat(#{id}): {description}"
rtk git push origin feature/{id}-{slug}
```

### Step 4: Create PR

```bash
rtk az repos pr create \
  --repository {repo} \
  --source-branch feature/{id}-{slug} \
  --target-branch main \
  --title "feat(#{id}): {title}" \
  --description "{description}"
```

### Step 5: Link work item (MANDATORY, run sequentially, not in parallel)

```bash
rtk az repos pr work-item add --id {pr-id} --work-items {workitem-id}
```

### Step 6: Post screenshot comment

Build raw URL for each image:
```
https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/items?path=openspec/changes/{change}/images/{file}.png&versionType=branch&version={branch}&api-version=7.1
```

Post via:
```bash
rtk az devops invoke \
  --area git --resource pullRequestThreads \
  --route-parameters project={project} repositoryId={repo} pullRequestId={pr-id} \
  --http-method POST --api-version 7.1 --in-file body.json
```

`body.json`:
```json
{
  "comments": [{
    "parentCommentId": 0,
    "content": "## Screenshots\n\n![{feature}]({raw-url})",
    "commentType": 1
  }],
  "status": "active"
}
```

---

## Mode B: Read PR Feedback (feedback mode)

Triggered when user says "I've added comments to the PR" or "check PR feedback".

### Step 1: Find PRs

If PR link provided, extract ID from URL. Otherwise:
```bash
rtk az repos pr list --repository {repo} --status active --top 1
```

### Step 2: Read comment threads

```bash
rtk az devops invoke \
  --area git --resource pullRequestThreads \
  --route-parameters project={project} repositoryId={repo} pullRequestId={id} \
  --http-method GET --api-version 7.1
```

### Step 3: Categorize feedback

| Category | Description | Action |
|----------|-------------|--------|
| `code-change` | Reviewer requests code modification | Return to lead to spawn specialists |
| `spec-update` | Affects proposal, design, or tasks | Update openspec artifacts |
| `question` | Reviewer asks a question | Reply with answer |
| `resolved` | Thread already resolved | Skip |

### Step 4: Update openspec (if spec-update)

```bash
rtk git branch --show-current
# feature/193208-roles-crud → change: us-193208-roles-crud
```

Update: `openspec/changes/{change}/proposal.md`, `design.md`, or `tasks.md` as appropriate.

### Step 5: Reply to each thread

```bash
rtk az devops invoke \
  --area git --resource pullRequestThreadComments \
  --route-parameters project={project} repositoryId={repo} pullRequestId={id} threadId={tid} \
  --http-method POST --api-version 7.1 --in-file reply.json
```

`reply.json`:
```json
{
  "comments": [{
    "parentCommentId": 1,
    "content": "Acknowledged, applying this change now.",
    "commentType": 1
  }]
}
```

---

## Guardrails

- ✅ Commit and push to feature branches only
- ✅ Create and comment on PRs via az CLI
- ✅ Screenshots of localhost only via browser_screenshot
- ❌ Commit or push to `main`, FORBIDDEN
- ❌ Force push, FORBIDDEN
- ❌ Merge or approve PRs, human-only
- ❌ Navigate browser to dev.azure.com, FORBIDDEN

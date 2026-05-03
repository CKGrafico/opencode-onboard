---
name: ob-userstory-az
description: Parse Azure DevOps user story URL and create OpenSpec change. Use when user provides an Azure DevOps URL.
license: MIT
compatibility: Requires openspec CLI and Azure CLI.
metadata:
  author: copilots
  version: "3.1"
---

**RTK - MANDATORY**

Use `rtk` wrapper for ALL CLI commands:
- `rtk az boards work-item show` NOT `az boards work-item show`
- `rtk openspec new change` NOT `openspec new change`

**Browser MCP tools are FORBIDDEN for all Azure DevOps operations.**

---

## Azure CLI Setup (One-Time)

```bash
az config set extension.dynamic_install_allow_preview=true
az extension add --name azure-devops
az login
az devops login --organization https://dev.azure.com/{org}
```

**PAT Token**, go to `https://dev.azure.com/{org}/_usersSettings/tokens`
Create with scopes: **Work Items (Read & Write)** + **Code (Read & Write)**

---

## Steps

1. **Extract Work Item ID** from URL
   - `?workitem=193208` → ID: 193208
   - `/workitems/edit/193208` → ID: 193208

2. **Fetch Work Item**
   ```bash
   rtk az boards work-item show --id 193208
   ```
   Do NOT use `--organization` flag (uses default org).

3. **Extract Key Fields** from JSON response:
   - `fields.System.Title` → Title
   - `fields.System.Description` → Description (may be HTML, strip tags)
   - `fields.System.WorkItemType` → Type
   - `fields.System.IterationPath` → Sprint
   - `fields.System.State` → State
   - `fields.System.AcceptanceCriteria` → AC (if present)

4. **Create OpenSpec Change**
   ```bash
   rtk openspec new change "us-{id}-{slug}"
   ```

---

## Full Azure DevOps CLI Reference

Use these for ALL DevOps operations, browser MCP is FORBIDDEN.

### Work Items
```bash
# Read work item
rtk az boards work-item show --id <id>

# Update work item state
rtk az boards work-item update --id <id> --state "Active"
```

### PR Threads (Comments)
```bash
# Read all threads
rtk az devops invoke \
  --area git --resource pullRequestThreads \
  --route-parameters project={project} repositoryId=<repo> pullRequestId=<id> \
  --http-method GET --api-version 7.1

# Post new comment thread (requires body.json)
rtk az devops invoke \
  --area git --resource pullRequestThreads \
  --route-parameters project={project} repositoryId=<repo> pullRequestId=<id> \
  --http-method POST --api-version 7.1 --in-file body.json

# Reply to existing thread
rtk az devops invoke \
  --area git --resource pullRequestThreadComments \
  --route-parameters project={project} repositoryId=<repo> pullRequestId=<id> threadId=<tid> \
  --http-method POST --api-version 7.1 --in-file reply.json
```

### Comment Body JSON format
```json
{
  "comments": [
    {
      "parentCommentId": 0,
      "content": "Your markdown comment here.",
      "commentType": 1
    }
  ],
  "status": "active"
}
```

For replies, `parentCommentId` should be the ID of the first comment in the thread (usually 1).

---

## Screenshot / Image Strategy

**Never upload images as PR attachments.** Save to openspec change folder and reference via raw URL.

### Save location
```
openspec/changes/{change-name}/images/{screenshot}.png
```

### Raw URL format (renders inline in PR comments)
```
https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repo}/items?path=openspec/changes/{change}/images/{file}.png&versionType=branch&version={branch}&api-version=7.1
```

Do NOT use `_git/` URLs, they return HTML, not raw binary.

---

## URL Formats Reference

```
# Sprint board with work item
https://dev.azure.com/{org}/{project}/_sprints/backlog/{team}/{project}/Sprint%20110?workitem=193208

# Direct work item
https://dev.azure.com/{org}/{project}/_workitems/edit/193208

# PR
https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{pr-id}
```

---

## Output Format

```
## User Story Parsed

**Work Item:** #{id}
**Title:** {title}
**Type:** User Story
**Iteration:** {sprint}
**State:** {state}

**Change Created:** us-{id}-{slug}
```

After outputting the above, the lead MUST run `/opsx-propose` to generate the proposal, specs, and tasks. After `/opsx-propose` completes, STOP and ask the user: **"Ready to implement? (yes/no)"**, do NOT proceed to `/opsx-apply` until confirmed.

---

## Guardrails

- ✅ Parse Azure DevOps URL and create OpenSpec change
- ✅ Use `rtk` for all Azure CLI operations
- ✅ Always run `/opsx-propose` after parsing, never skip to implementation
- ✅ Always stop and confirm with user after propose, before running `/opsx-apply`
- ❌ Browser MCP tools for Azure DevOps operations, FORBIDDEN
- ❌ Jump to implementation without user confirmation, FORBIDDEN

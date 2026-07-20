---
name: ob-ops-evidence
description: Capture visual/textual evidence of a completed change and post it as a comment on the originating issue or work item. Best-effort and non-fatal - a screenshot of the running UI (or a text summary for non-UI work) committed under the change's images/ folder, then linked from the backlog item. Load after a change is implemented and pushed. Invoked by the /ops-evidence command and the plan-goal pipeline (pr/push modes).
license: MIT
---

# Ops Evidence

Produce evidence of what a change actually did, and surface it where a human reviewing asynchronously will see it: as a comment on the originating issue/work item.

> **This skill is best-effort and MUST NEVER be fatal.** Capturing a screenshot means starting the app and driving a browser, which is the flakiest thing in any pipeline. Every step here is wrapped in "on failure, log and continue". A caller (e.g. plan-goal) must treat a failed evidence run as a warning, never as a reason to halt, roll back, or block a merge/PR. Evidence is garnish; the change is the meal.

## Input

The caller provides (all optional):
- The **change id** (used to locate `openspec/changes/{change-id}/` and its `images/` folder).
- The **issue / work-item reference** (issue number, work-item id, or URL) to comment on. If absent, capture evidence but skip the comment.
- The **output mode** (`default` / `push` / `pr`): whether the branch was pushed. This decides whether image URLs can resolve (see Comment).
- A **time budget** for capture (default: ~2 minutes total).

## Part 1 - Capture (generic, best-effort)

1. **Decide UI vs non-UI.** Inspect the change's `touches` / the actual diff. If the change modified user-facing UI (components, pages, styles, routes), attempt a screenshot. Otherwise skip to text evidence (step 4).

2. **Screenshot the running app (time-boxed).** Only via the local browser automation (`@browser-automation` skill; `localhost` only — navigating to github.com / dev.azure.com with browser tools is FORBIDDEN):
   - Start or detect the app's dev server on `localhost`.
   - Navigate to the relevant route, wait for the UI to settle, capture.
   - Enforce the time budget. If the server won't start, the route 404s, or the budget is exceeded → **abandon capture, log why, continue.** Do not retry more than once.

3. **Save the image** into the change's own `images/` folder. Resolve where the change currently lives — it may still be active, or already archived — and write into whichever exists (prefer the archived path):

   ```bash
   REPO_ROOT="$(git rev-parse --show-toplevel)"
   DEST="$(ls -d "$REPO_ROOT/openspec/changes/archive/"*"{change-id}" 2>/dev/null | head -1)"
   [ -z "$DEST" ] && DEST="$REPO_ROOT/openspec/changes/{change-id}"
   mkdir -p "$DEST/images"
   # save the screenshot to "$DEST/images/{feature}.png"
   ```

   Callers that archive before capturing (e.g. plan-goal) will resolve the archived path, so the evidence is stored **inside** the archived change folder (`openspec/changes/archive/YYYY-MM-DD-{change-id}/images/`) rather than depending on the archive step to move it.

4. **Text evidence (always available, the fallback).** Whether or not a screenshot was captured, assemble a short text summary: change id, tasks N/N done, the verification result (tests/lint/build pass), and the commit list. This is the evidence used when there is no image or no resolvable URL.

## Part 2 - Comment on the issue / work item (platform-specific)

**Preconditions — check before commenting:**
- An issue / work-item reference was provided. If not → skip the comment; report what was captured locally.
- An **image URL can resolve** ONLY if the branch was pushed (a commit SHA exists on the remote). In `pr` and `push` modes the branch is pushed → embed the image. In `default` mode nothing is pushed → **do not embed an image URL (it would 404); post text evidence only, or skip.** Never post a dead image link.
- Backlog platform is set in `.opencode/opencode-onboard.json` → `platform.backlog`. If it is `none` or `browser`, skip the comment entirely (no CLI to post with; browser posting to external services is forbidden).

The platform-specific comment procedure is injected by the CLI during onboarding.

<!-- OB-PLATFORM-EVIDENCE-START -->
<!-- OB-PLATFORM-EVIDENCE-END -->

## Report

Tell the caller, in one block:
- Whether a screenshot was captured (and its path) or why not.
- Whether a comment was posted (and where) or why it was skipped.
- Never present a skipped/failed evidence step as a pipeline failure.

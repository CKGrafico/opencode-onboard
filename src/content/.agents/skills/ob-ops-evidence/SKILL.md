---
name: ob-ops-evidence
description: Produce auditable evidence that a completed change works, and publish it to the originating issue/PR. Decides whether evidence is required, delegates to a project-provided evidence harness when one exists (else captures a screenshot generically), writes evidence/evidence.json with a passed/skipped/failed/blocked status, and separately publishes an idempotent verified comment. Load after a change is implemented. Invoked by the /ops-evidence command and the plan-goal pipeline.
license: MIT
---

# Ops Evidence

Produce evidence of what a change actually did, store it inside the OpenSpec change (so it travels on archive), and surface it where an async reviewer will see it: a comment on the originating issue and PR.

Capture is best-effort and must never be fatal to a pipeline. But be honest about outcomes: a change that needed evidence and couldn't produce it is blocked, not skipped. Surface that honestly. Publishing is separate and, when a caller opts into it as a ship gate, may block shipping.

## Input

The caller provides (all optional):
- change id: locates `openspec/changes/{change-id}/` (or the archived `archive/*{change-id}/`).
- issue / work-item ref and PR number: where to publish. Absent means capture only.
- output mode (`default` / `push` / `pr`): whether the branch was pushed (decides whether image URLs resolve).
- operation: `capture` (default), `publish`, or `both`. plan-goal runs `capture` after archive and `publish` after push.

## The evidence contract

Evidence lives at `openspec/changes/{change-id}/evidence/` and follows the schema and status definitions in the [evidence contract](../ob-make-evidence-scaffold/evidence-contract.md) reference. That reference is the single source of truth for the `evidence.json` schema and status semantics.

## Part 1: Capture (operation: capture / both)

**Step 1: Decide whether evidence is required.** Inspect the change's `touches`/diff and proposal:
- Required when changed files include user-visible UI: components, pages/views/routes, styles (`*.css/scss/less`), `*.tsx/jsx/vue/svelte`, layout, navigation, dialogs/forms, or loading/empty/error/success states, or the proposal describes a UI/interaction/styling change.
- Skipped when the change is docs-only, an internal refactor with no visible behavior, dependency-only, test-only, logging-only, or backend/main-process-only with no user-visible component.
- Mixed or unknown: required (be safe).

If skipped: write `evidence.json` with `status: "skipped"` and reason, no assets, and stop. This is success.

**Step 2: Prefer a project-provided evidence harness.** Many mature repos build a deterministic harness (Playwright/Electron/Vite scenarios with assertions). If the project has one, delegate to it instead of a naive screenshot, it is more reliable and produces richer, asserted evidence. Detect it in this order:
- a `visual-evidence` script in `package.json`: run it: `pnpm visual-evidence --change {change-id}` (or the repo's package manager). Respect its exit codes: `0` passed/skipped, `1` failed, `2` blocked, `3` invalid input.
- a `visual-evidence` skill in `.agents/skills/`: load and follow it.
- a documented evidence entrypoint in `AGENTS.md` / `README.md`.

A project harness writes `evidence/` and `evidence.json` itself; consume its manifest and `prMarkdown` and skip to Part 2. If no harness exists, tell the user once that `/make-evidence-scaffold` can scaffold one, then fall back to Step 3.

**Step 3: Generic fallback capture (time-boxed, best-effort).** Only via `@browser-automation` (`localhost` only). Use the `browser-automation` skill's localhost scope rule: external services are out of scope for browser tools.
- Start/detect the app's dev server, navigate to the relevant route, wait for the UI to settle, screenshot.
- Enforce a time budget (~2 min). Server won't start / route 404s / budget exceeded: write `evidence.json` with `status: "blocked"` and reason, and continue. Do not retry more than once.
- Save into the change's `evidence/` folder, resolving where the change currently lives (active or already archived; prefer archived):

  ```bash
  REPO_ROOT="$(git rev-parse --show-toplevel)"
  DEST="$(ls -d "$REPO_ROOT/openspec/changes/archive/"*"{change-id}" 2>/dev/null | head -1)"
  [ -z "$DEST" ] && DEST="$REPO_ROOT/openspec/changes/{change-id}"
  mkdir -p "$DEST/evidence"
   # save the screenshot to "$DEST/evidence/01-final.png"
   ```

- Send command output and any intermediate capture files to `$REPO_ROOT/.opencode/.tmp/evidence-{change-id}/`, then copy final assets directly into `$DEST/evidence/`. Do not use an operating-system temporary directory.

**Step 4: Always write `evidence.json`.** Even non-UI/skipped/blocked changes get a manifest so the outcome is auditable. Write it and every final asset under `$DEST/evidence/`, with manifest paths matching that archived location. Build `prMarkdown` from the assets (or a text summary: tasks N/N, verification result, commit list).

Capture never commits, stages, or pushes. The caller owns git.

## Part 2: Publish (operation: publish / both, platform-specific)

Preconditions:
- An issue/work-item ref (and/or PR number) was provided. Else skip publishing.
- Image URLs resolve only if the branch was pushed. In `pr`/`push` modes embed images; in `default` mode post text evidence only (never a dead image link).
- Backlog platform from `.opencode/opencode-onboard.json` -> `platform.backlog`; `none`/`browser` means skip publishing.
- Publish one idempotent status comment for every manifest result. A `blocked` or `failed` result must state its status and reason; it must never be presented as passed.

The platform-specific publish procedure is injected by the CLI during onboarding:

<!-- OB-PLATFORM-EVIDENCE-START -->
<!-- OB-PLATFORM-EVIDENCE-END -->

## Report

One block: the `status` (passed/skipped/failed/blocked) and why; assets written (paths) or why not; whether a comment was posted (and where) or why skipped. Never present a best-effort capture miss as a pipeline failure, but surface `blocked`/`failed` honestly.

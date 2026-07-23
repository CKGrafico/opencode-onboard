---
name: ob-make-evidence-scaffold
description: One-time scaffold of a project-specific visual-evidence harness (deterministic capture + assertions + manifest + publisher) that /ops-evidence and /plan-goal delegate to. Invoked by the /make-evidence-scaffold command.
license: MIT
---
Generate a stack-adapted visual-evidence harness in this project so evidence capture is deterministic and asserted, not a naive one-off screenshot. Once it exists, the `ob-ops-evidence` skill auto-detects and delegates to it. This scaffolds a starting point that follows the contracts below. The user then registers per-feature scenarios over time.

This is a one-time setup command. It creates the harness scaffold, not per-change evidence. To capture evidence for a specific change, use `/ops-evidence` (or `/plan-goal`, which calls it).

Input (optional): `$ARGUMENTS` may name the app entrypoint, dev command, or framework to target.

## Step 0: Inspect an existing harness and its skill

Check whether a visual-evidence harness already exists: a `visual-evidence` (and/or `visual-evidence:publish`) script in `package.json` or a `src/visual-evidence/` (or equivalent) directory. Also read `.agents/skills/visual-evidence/SKILL.md` when it exists.

- Existing harness plus a skill with YAML frontmatter containing non-empty `name: visual-evidence` and `description:`: stop and tell the user to register a scenario rather than re-scaffold.
- Existing harness plus a missing or invalid skill: preserve the harness, skip to the local skill creation in Step 3, and repair only `SKILL.md`.
- No harness: continue through the full scaffold.

## Step 1: Detect the stack

Read `package.json` (scripts, deps), and look for the app shell:
- Electron (`electron` dep, `src/main` + `src/renderer`): Playwright `_electron` launcher.
- Web SPA (Vite/CRA/Next/SvelteKit dev server): Playwright Chromium against the dev server (headless-friendly, no GUI libs).
- Component workbench (Storybook/Ladle): drive stories directly.
- Neither: generate the Web SPA variant and leave a `TODO` for the launch step.

Pick the package manager from the lockfile (`pnpm-lock.yaml` -> pnpm, `package-lock.json` -> npm, `yarn.lock` -> yarn). Prefer TypeScript (`tsx`) when the repo is TS, else plain `.mjs` (runs on `node` with no extra tooling).

## Step 2: Scaffold the harness

Create `src/visual-evidence/` (or the repo's conventional location) implementing these modules. Each is small and stack-agnostic except the launcher and scenarios:

1. `evidence-required`: a pure decision function over `{ changedFiles, proposal }` returning `{ required, reason }`. Required when files touch user-visible UI (components, pages/views/routes, `*.css/scss/less`, `*.tsx/jsx/vue/svelte`, layout, navigation, dialogs/forms, loading/empty/error/success states) or the proposal describes a UI/interaction/styling change; skipped for docs-only / internal-refactor / deps-only / test-only / logging-only / backend-only; mixed means required. Make the path patterns a top-of-file constant the user can tune.
2. `openspec-resolver`: locate the change at `openspec/changes/<id>/` (active) or `openspec/changes/archive/*<id>/` (archived, prefer newest); refuse to guess between multiple active changes; read `proposal.md`/`tasks.md` for acceptance criteria and affected files.
3. `manifest`: write `openspec/changes/<id>/evidence/evidence.json` following the [evidence contract](evidence-contract.md) schema. Types and validation included when TS.
4. `launch` (stack-specific): start the app deterministically: fresh temp profile/user-data, mock/fixture adapter (no real credentials or network), fixed viewport. Web variant: boot the dev server and headless Chromium. Electron variant: Playwright `_electron.launch` (documented `xvfb-run` and GUI libs note for headless Linux).
5. `capture`: screenshot (and optional GIF via ffmpeg, dropped if it exceeds a byte budget); a size-limit ladder that reduces dimensions/quality to a readability floor; strip metadata.
6. `scenario-registry` and one sample scenario for a real route in this app: assertions via accessible selectors (`getByRole`/`getByText`/`getByLabel`, auto-waiting, no fixed sleeps) and named capture checkpoints. Include an evidence contract mapping each acceptance criterion to assertion(s) to checkpoint(s); a run missing any fails. The registry returns `blocked` for unknown change-ids rather than fabricating selectors.
7. `run`: the orchestrator: resolve change, decide required (skip if not), derive/lookup scenario (blocked if none), launch, run scenario and assertions, capture, enforce size limits, write final assets and `evidence.json`, return a structured result. On failure after launch: keep `failure.png`/video/trace under gitignored `.opencode/.tmp/`, promote nothing to `evidence/`, return `failed`.
8. `cli`: `--change <id>` / `--input <path.json>`. Exit codes: `0` passed/skipped, `1` failed, `2` blocked, `3` invalid input. Capture never commits or pushes.
9. `publish` (separate CLI): after the branch is pushed, verify each asset exists on the remote (GitHub: `gh api repos/{o}/{r}/contents/<path>?ref=<sha>`), then upsert one marked, idempotent comment (`<!-- ob-visual-evidence:<id> -->`) on both the issue and the PR (PATCH if the marker exists, else POST). Publish failure blocks shipping.

Add `package.json` scripts: `"visual-evidence"` -> the capture CLI, `"visual-evidence:publish"` -> the publish CLI. Ensure `.opencode/.tmp/` is gitignored.

## Step 3: Create the local visual-evidence skill, wire, and report

Create or repair `.agents/skills/visual-evidence/SKILL.md`. It must begin with:

```yaml
---
name: visual-evidence
description: Capture auditable evidence for a completed change with this repository's visual-evidence harness. Use when ob-ops-evidence requests evidence capture or when validating a user-visible change.
license: MIT
---
```

Its body must describe the actual harness location, capture and publish commands, scenario registry location, archive evidence output path, exit codes, and `.opencode/.tmp/visual-evidence/<change-id>/` scratch path. Do not write generic instructions that do not match the generated harness.

- Confirm `ob-ops-evidence` will detect it (the `visual-evidence` package script now exists).
- If the project has system deps for the chosen stack (ffmpeg for GIF, GUI libs and `xvfb` for Electron on Linux), list them.
- Read the generated skill and verify its frontmatter has non-empty `name: visual-evidence` and `description:` values.
- Tell the user: register a scenario per feature in the registry; run `<pm> run visual-evidence --change <id>` to capture and `<pm> run visual-evidence:publish --change <id> --pr <n>` to publish.

Do not implement scenarios for every existing change. Scaffold the framework plus one working sample, and stop.

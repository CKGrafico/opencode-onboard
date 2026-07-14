---
description: Read and triage PR review feedback. Reports what needs fixing, does not implement fixes.
---

The `@ob-review` skill is platform-specific. Repo platform is set in `.opencode/opencode-onboard.json` → `platform.repo`. Load the skill matching the repo platform and follow its instructions.

Reads and classifies PR review comments. Reports what needs fixing: does not implement fixes directly. Fixing is done via `/plan-apply`.

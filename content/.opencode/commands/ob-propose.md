---
description: Parse a work item or idea and propose a change plan with enriched task assignments.
---

> **Command alias:** The loaded skill may reference `/opsx-propose` — that means this command. Use `/ob-propose` wherever the skill suggests `/opsx-propose`.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).

**If a work item URL is provided** (GitHub Issue or Azure DevOps work item): load `@ob-userstory` skill and fetch the work item via CLI before continuing. Platform is set in `.opencode/opencode-onboard.json` `wizard.platform`. If platform is `none`, skip this step and work from direct user input.

Load `@openspec-propose` skill and follow its instructions.

After `tasks.md` is generated, apply this enrichment step before showing the plan:

<!-- OB-OPSX-PROPOSE-START -->
<!-- OB-OPSX-PROPOSE-END -->

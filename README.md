<div align="center">

<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/logo.png" alt="opencode-onboard" width="160" />

# 🧰 opencode-onboard

**One command to prepare any codebase for AI agent workflows in OpenCode.**

Works with [OpenCode](https://opencode.ai), [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), [OpenSpec](https://github.com/fission-ai/openspec), GitHub, Azure DevOps, or no tracker/PR platform at all.

[![npm version](https://img.shields.io/npm/v/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![npm downloads](https://img.shields.io/npm/dm/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![license](https://img.shields.io/npm/l/opencode-onboard?style=flat-square&color=black)](./LICENSE)
[![node](https://img.shields.io/node/v/opencode-onboard?style=flat-square&color=black)](https://nodejs.org)

</div>

## What is this?

Most codebases have no `AGENTS.md`, no architecture docs agents can read, and no defined workflow for picking up tasks. Agents end up improvising, and that produces inconsistent, brittle results.

**opencode-onboard** fixes that in a single interactive run. It installs a universal and agnostic agent team,but let you choose your own skills, preconfigured your AI models, and initd OpenCode with Openspec and Ensemble.

<div align="center">
<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/demo.gif" alt="opencode-onboard demo" width="700" />
</div>

## Quick start

```bash
npx opencode-onboard@latest
```

Requires **Node.js 18+**.

### Run specific steps

You can run individual setup/maintenance steps without running the full wizard:

```bash
# Run one step directly
npx opencode-onboard clean
npx opencode-onboard platform
npx opencode-onboard copy
npx opencode-onboard openspec
npx opencode-onboard models
npx opencode-onboard optimization
npx opencode-onboard browser
npx opencode-onboard metadata
npx opencode-onboard join

# Show CLI help and all commands
npx opencode-onboard --help
npx opencode-onboard -h
```

When available, step commands reuse context from `.opencode/opencode-onboard.json`.

Typical flow for reruns:

- Run `clean` if you want to reset old AI files
- Run `copy` if templates/skills changed in a new onboard release
- Run `optimization` if you want to reconfigure RTK/quota/caveman + `ob-global`
- Run `metadata` last to refresh `.opencode/opencode-onboard.json`
- Run `join` if you're a new member of an existing onboarded project and want to sync the latest onboarding metadata

---

## How it works

The CLI runs a 10-step onboarding wizard. It keeps the current step visible, plus the last two completed steps, so progress is always clear.

| Step                              | What happens                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Source scope**               | Choose current repo or sibling source roots for code analysis                                                                                                        |
| **2. Clean AI files**             | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.agents/` etc. and removes them, preserves your `.agents/skills/`                                        |
| **3. Choose platform**            | GitHub, Azure DevOps, or None                                                                                                                                       |
| **4. Check platform CLI**         | Verifies `gh` (GitHub) or `az` + `azure-devops` (Azure DevOps), or skips checks when platform is None                                                              |
| **5. Copy scaffolding**           | Copies agents + built-in skills + bootstrap docs, writes source-roots metadata, applies AGENTS bootstrap patching, copies `skills-lock.json`, then runs `npx skills` |
| **6. Init OpenSpec**              | Runs `npx @fission-ai/openspec init` silently for structured change management                                                                                       |
| **7. Choose models**              | Fetches live model list from [models.dev](https://models.dev), lets you pick plan / build / fast models with cost indicators and canonical pricing                   |
| **8. Token optimization tools**   | Optional (recommended). One checklist step for RTK check, opencode-quota setup, caveman install, and dynamic `ob-global` token-optimization rule injection           |
| **9. Install browser plugin**     | Installs `@different-ai/opencode-browser` globally for agent browser automation                                                                                      |
| **10. Write onboarding metadata** | Writes `.opencode/opencode-onboard.json` with selected setup details                                                                                                 |

When it finishes, open OpenCode in your project and type:

```
/ob-init
```

OpenCode asks if this is a greenfield or brownfield project. For brownfield projects it generates `ARCHITECTURE.md` and `DESIGN.md` from your actual codebase, archives project history, then activates the full agent team. For greenfield projects it skips doc generation and leaves placeholder files you can populate later with `/ob-create-architecture` and `/ob-create-design`.

---

## Commands

Custom slash commands are installed into `.opencode/commands/` and are available directly in OpenCode.

| Command        | Description                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `/ob-init`        | Initialize the project. Asks greenfield vs brownfield, then activates the agent team. Supports skipping doc generation for new projects. |
| `/ob-plan <url>`  | Parse a user story URL and produce a plan, proposal, specs, and tasks. Stops before implementation. Use platform mode, not `None`.   |
| `/ob-main <task>` | Quick direct implementation, no OpenSpec, no ensemble, no PRs. Just do it.                            |
| `/ob-create-engineer <name> "<description>"` | Create a custom engineer agent from a description, with skills auto-installed from [skills.sh](https://www.skills.sh/) |
| `/ob-create-architecture` | Generate or regenerate `ARCHITECTURE.md` from the codebase. Safe to rerun any time the architecture changes. |
| `/ob-create-design` | Generate or regenerate `DESIGN.md` from the codebase design system. Safe to rerun any time the design system changes. |

---

## Agents and Skills

opencode-onboard draws a hard line between two concepts:

### Agents, universal behaviors

Agents define _how to work_. They are universal personas (same behavior across projects and stacks).

Current baseline uses a generic execution model:

```
devops-manager     lead/orchestrator, planning, PR lifecycle
basic-engineer     implementation worker, ability-driven
```

`basic-engineer` behavior is composed by abilities, not hardcoded role silos.
Project-specific specialization comes from user-created custom engineers via `/ob-create-engineer`. During `/opsx-apply`, the lead should inspect the engineers that actually exist in `.agents/agents/`, prefer matching custom engineers, and fall back to `basic-engineer` only when no specialist is a clear fit.

### Skills, platform knowledge

Skills define _what to know_. They provide project rules, platform behavior, and task-specific execution guidance. Agents auto-detect/load relevant skills; **you do not manually choose skills per prompt**.

If you choose platform `None` during onboarding, no userstory or pull-request platform skills are injected into the workflow. The project works from direct conversation, local repo context, and optional OpenSpec artifacts only.

Current loading model:

- `ob-global` is baseline and should be loaded first
- `ob-default` is fallback when nothing else matches
- `ob-generic-guardrails` is a minimal base users can extend with custom guardrail skills

Default `basic-engineer` abilities:

```
## Abilities
- Guardrails: @ob-generic-guardrails, @ob-default
- Development: @ob-default
- Testing: @ob-default
- Infrastructure: @ob-default
```

Users are expected to create additional skills and map them into abilities over time.

Built-in skills (`ob-` prefix) shipped with opencode-onboard:

| Skill                   | Purpose                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ob-global`             | Baseline skill loaded first: context rules, source-roots scope, git/secrets guardrails, token-optimization rules |
| `ob-default`            | Fallback, when no other skill matches. Still loads ob-global first                                               |
| `ob-generic-guardrails` | Foundation for user guardrails skills                                                                            |
| `ob-userstory-gh`       | Parse a GitHub Issue URL into a structured work item                                                             |
| `ob-userstory-az`       | Parse an Azure DevOps work item URL                                                                              |
| `browser-automation`    | Browser control via `@different-ai/opencode-browser`                                                             |

Skills live in `.agents/skills/`. Any `SKILL.md` file in a subdirectory is automatically discoverable, write your own and agents will pick them up.

### Models, plan / build / fast

During onboarding you pick three models:

| Role      | Used by               | Pick                                    |
| --------- | --------------------- | --------------------------------------- |
| **plan**  | Main OpenCode session | Something capable with strong reasoning |
| **build** | All builder agents    | Something capable for implementation    |
| **fast**  | `devops-manager`      | Something fast and cheap                |

Models are fetched live from [models.dev](https://models.dev) (3000+ models, cached weekly). Cost tiers `[$]` `[$$]` `[$$$]` always reflect the canonical provider price, so `github-copilot/claude-opus-4.7` shows `[$$]` not `[$]`.

---

## The pipeline

When you give the lead agent a work item URL, execution follows this pipeline. If onboarding platform is `None`, skip the work item / PR stages and work directly from conversation plus optional OpenSpec artifacts:

```
devops-manager (load ob-global first)
                  ↓
         parse work item via userstory skill
                  ↓
              openspec-propose
        proposal + specs + tasks
                  ↓
             [confirm with user]
                  ↓
 basic-engineer + custom-engineer-* (parallel)
 claim tasks → load abilities → implement
                  ↓
       verify (tests/build/lint as needed)
                  ↓
    devops-manager (ship mode, if configured)
  commit → push → PR → feedback loop
```

1. Load `ob-global` baseline rules
2. Load platform userstory skill (`ob-userstory-gh` or `ob-userstory-az`)
3. Run `/opsx-propose` to produce `proposal.md`, specs, and `tasks.md`
4. Confirm with user before implementation
5. Run `/opsx-apply` to orchestrate implementation workers
6. Spawn one or more engineers in parallel (`basic-engineer` and/or custom engineers)
7. Each engineer claims tasks, loads relevant abilities, and executes
8. Verify with tests/build/lint according to task scope
9. Ship/update PR via devops-manager flow

Each agent runs in its own isolated git worktree via [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), with a live dashboard at `http://localhost:4747`.

---

## What gets installed

```
your-project/
├── AGENTS.md                        ← bootstrap mode, replaced after first "init"
├── ARCHITECTURE.md                  ← prompt for agents to fill in from your codebase
├── DESIGN.md                        ← prompt for agents to fill in from your codebase
├── .opencode/
│   ├── opencode.json                ← default model + plugin config
│   ├── ensemble.json                ← model assignments for plan/build/fast roles
│   └── opencode-onboard.json        ← onboarding metadata snapshot
└── .agents/
    ├── agents/
    │   ├── devops-manager.md
    │   └── basic-engineer.md
    └── skills/
        ├── ob-global/              ← baseline skill, load FIRST
        ├── ob-default/             ← fallback skill
        ├── ob-generic-guardrails/  ← foundation for user guardrails
        ├── ob-userstory-gh/      ← or -az, depending on platform
        ├── ob-userstory-az/
        └── browser-automation/
```

`ob-global` is the baseline skill template. During onboarding, source-roots and token-optimization sections are injected into that template.

---

## The bootstrap sequence

The first time you type `init` in OpenCode after onboarding, the agent asks whether this is a **greenfield** or **brownfield** project:

### Brownfield (existing codebase)

1. Bootstrap-mode `AGENTS.md` triggers the initialization workflow
2. OpenCode archives existing project context into OpenSpec (`project-history`)
3. OpenCode runs `/ob-create-architecture` → generates real `ARCHITECTURE.md` from your codebase
4. OpenCode runs `/ob-create-design` → generates real `DESIGN.md` from your design system
5. OpenSpec `config.yaml` is populated with discovered tech stack and domain context
6. Bootstrap `AGENTS.md` is replaced with production guidance
7. Team workflows become fully active for normal implementation tasks

### Greenfield (new project, little or no existing code)

1. Bootstrap-mode `AGENTS.md` triggers the initialization workflow
2. OpenSpec `config.yaml` is populated with what is known (intended stack, domain)
3. Bootstrap `AGENTS.md` is replaced with production guidance
4. `ARCHITECTURE.md` and `DESIGN.md` are left as placeholder files

Once your codebase has meaningful content, run:
- `/ob-create-architecture` to generate architecture docs
- `/ob-create-design` to generate design system docs

Both commands are safe to rerun at any time as the project evolves.

---

## Token Budget Controls

Long unattended agent sessions can consume significant tokens. Set these controls up **before** first use:

1. **Set provider-side limits first** — monthly soft-limit + hard usage cap in your provider dashboard:
   - OpenAI: [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
   - Anthropic: [console.anthropic.com](https://console.anthropic.com)
   - Google AI Studio: [aistudio.google.com/app/usage](https://aistudio.google.com/app/usage)

2. **Route models by task type** — use a fast/cheap model (e.g. `haiku`, `gpt-4o-mini`) for orchestration and status loops; reserve expensive models (e.g. `sonnet`, `opus`, `gpt-4o`) for implementation tasks only.

3. **Install the quota plugin** — the [`opencode-quota`](https://github.com/opencode-ai/opencode-quota) plugin adds `/quota` and `/quota_status` commands that surface real-time token usage inside OpenCode sessions.

4. **Use `/quota` checkpoints** — run `/quota` before starting any `/opsx-apply` session and after each agent wave. Pause at 75% consumed; stop at 90%.

5. **Confirm before large runs** — the onboarded `/opsx-apply` workflow will ask for your confirmation before spawning agents for Medium (4–7 tasks) or High (8+ tasks) scope sessions.

---

## Prerequisites

| Requirement                                                                                          | Notes                                  |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Node.js 18+**                                                                                      | Required                               |
| **[OpenCode](https://opencode.ai)**                                                                  | The agent runtime                      |
| **[gh CLI](https://cli.github.com)**                                                                 | GitHub platform, must be authenticated |
| **[az CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)** + azure-devops extension | Azure DevOps platform                  |

---

## Development

Wizard choices and defaults live in `src/presets/` where possible:

- `source.json` controls source-scope prompt options
- `platforms.json` controls platform labels and CLI checks
- `clean.json` controls AI file detection and preservation
- `models.json` controls model role prompts and agent assignments
- `optimization.json` controls RTK/quota/caveman checklist defaults
- `quota.json` controls opencode-quota defaults
- `browser.json` controls opencode-browser installer automation

```bash
git clone https://github.com/ckgrafico/opencode-onboard.git
cd opencode-onboard
pnpm install

# Run the CLI locally
node src/index.js

# Run tests
pnpm test

# Run linting
pnpm lint

# Fix auto-fixable lint issues
pnpm lint:fix

# Watch mode
pnpm test:watch
```

Tests are written with [Vitest](https://vitest.dev). Linting uses ESLint flat config with Node ESM defaults and stricter correctness rules.

---

## License

MIT © [ckgrafico](https://github.com/ckgrafico)

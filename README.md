<div align="center">

<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/logo.png" alt="opencode-onboard" width="160" />

# 🧰 opencode-onboard

**One command to prepare any codebase for AI agent workflows in OpenCode.**

Works with [OpenCode](https://opencode.ai), [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), [OpenSpec](https://github.com/fission-ai/openspec), GitHub and Azure DevOps.

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

| Step | What happens |
|------|-------------|
| **1. Source scope** | Choose current repo or sibling source roots for code analysis |
| **2. Clean AI files** | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.agents/` etc. and removes them, preserves your `.agents/skills/` |
| **3. Choose platform** | GitHub or Azure DevOps |
| **4. Check platform CLI** | Verifies `gh` (GitHub) or `az` + `azure-devops` (Azure DevOps) |
| **5. Copy scaffolding** | Copies agents + built-in skills + bootstrap docs, writes source-roots metadata, applies AGENTS bootstrap patching, copies `skills-lock.json`, then runs `npx skills` |
| **6. Init OpenSpec** | Runs `npx @fission-ai/openspec init` silently for structured change management |
| **7. Choose models** | Fetches live model list from [models.dev](https://models.dev), lets you pick plan / build / fast models with cost indicators and canonical pricing |
| **8. Token optimization tools** | Optional (recommended). One checklist step for RTK check, opencode-quota setup, caveman install, and dynamic `ob-global` token-optimization rule injection |
| **9. Install browser plugin** | Installs `@different-ai/opencode-browser` globally for agent browser automation |
| **10. Write onboarding metadata** | Writes `.opencode/opencode-onboard.json` with selected setup details |

When it finishes, open OpenCode in your project and type:

```
init
```

OpenCode generates `ARCHITECTURE.md` and `DESIGN.md` from your actual codebase, then activates the full agent team.

---

## Commands

Custom slash commands are installed into `.opencode/commands/` and are available directly in OpenCode.

| Command | Description |
|---------|-------------|
| `/init` | Initialize the project: generate `ARCHITECTURE.md`, `DESIGN.md`, archive history, activate agent team |
| `/plan <url>` | Parse a user story URL and produce a plan — proposal, specs, and tasks. Stops before implementation. |
| `/main <task>` | Quick direct implementation — no OpenSpec, no ensemble, no PRs. Just do it. |

---

## Agents and Skills

opencode-onboard draws a hard line between two concepts:

### Agents, universal behaviors

Agents define *how to work*. They are universal personas (same behavior across projects and stacks).

Current baseline uses a generic execution model:

```
devops-manager     lead/orchestrator, planning, PR lifecycle
basic-engineer     implementation worker, ability-driven
```

`basic-engineer` behavior is composed by abilities, not hardcoded role silos.

### Skills, platform knowledge

Skills define *what to know*. They provide project rules, platform behavior, and task-specific execution guidance. Agents auto-detect/load relevant skills; **you do not manually choose skills per prompt**.

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

| Skill | Purpose |
|-------|---------|
| `ob-global` | Baseline skill loaded first: context rules, source-roots scope, git/secrets guardrails, token-optimization rules |
| `ob-default` | Fallback, when no other skill matches. Still loads ob-global first |
| `ob-generic-guardrails` | Foundation for user guardrails skills |
| `ob-userstory-gh` | Parse a GitHub Issue URL into a structured work item |
| `ob-userstory-az` | Parse an Azure DevOps work item URL |
| `browser-automation` | Browser control via `@different-ai/opencode-browser` |

Skills live in `.agents/skills/`. Any `SKILL.md` file in a subdirectory is automatically discoverable, write your own and agents will pick them up.

### Models, plan / build / fast

During onboarding you pick three models:

| Role | Used by | Pick |
|------|---------|------|
| **plan** | Main OpenCode session | Something capable with strong reasoning |
| **build** | All builder agents | Something capable for implementation |
| **fast** | `devops-manager` | Something fast and cheap |

Models are fetched live from [models.dev](https://models.dev) (3000+ models, cached weekly). Cost tiers `[$]` `[$$]` `[$$$]` always reflect the canonical provider price, so `github-copilot/claude-opus-4.7` shows `[$$]` not `[$]`.

---

## The pipeline

When you give the lead agent a work item URL, execution follows this pipeline:

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

The first time you type `init` in OpenCode after onboarding:

1. Bootstrap-mode `AGENTS.md` triggers the initialization workflow
2. OpenCode archives existing project context into OpenSpec (`project-history`)
3. OpenCode generates real `DESIGN.md` and `ARCHITECTURE.md` from your codebase
4. Bootstrap `AGENTS.md` is replaced with production guidance
5. Team workflows become fully active for normal implementation tasks

After this, every agent has accurate, persistent context about your project, no manual documentation required.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js 18+** | Required |
| **[OpenCode](https://opencode.ai)** | The agent runtime |
| **[OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble)** | Multi-agent parallel execution |
| **[rtk](https://github.com/rtk-ai/rtk#pre-built-binaries)** | Recommended for safer agent CLI command execution |
| **[gh CLI](https://cli.github.com)** | GitHub platform, must be authenticated |
| **[az CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)** + azure-devops extension | Azure DevOps platform |

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

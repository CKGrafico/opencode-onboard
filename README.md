<div align="center">

<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/logo.png" alt="opencode-onboard" width="160" />

# 🧰 opencode-onboard

**One command to prepare any codebase for AI agent workflows.**

Works with [OpenCode](https://opencode.ai), [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), [OpenSpec](https://github.com/fission-ai/openspec), GitHub and Azure DevOps.

[![npm version](https://img.shields.io/npm/v/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![npm downloads](https://img.shields.io/npm/dm/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![license](https://img.shields.io/npm/l/opencode-onboard?style=flat-square&color=black)](./LICENSE)
[![node](https://img.shields.io/node/v/opencode-onboard?style=flat-square&color=black)](https://nodejs.org)

</div>

## What is this?

Most codebases have no `AGENTS.md`, no architecture docs agents can read, and no defined workflow for picking up tasks. Agents end up improvising, and that produces inconsistent, brittle results.

**opencode-onboard** fixes that in a single interactive run. It installs a universal agent team, the skills they need, picks your AI models, and configures OpenCode, platform-aware, non-destructive, and ready the moment it finishes.

<div align="center">
<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/demo.gif" alt="opencode-onboard demo" width="700" />
</div>
---

## Quick start

```bash
npx opencode-onboard@latest
```

Requires **Node.js 18+**.

---

## How it works

The CLI clears the screen, shows a welcome banner, and walks you through 10 steps. The screen always shows the last 2 completed steps + the current one so you always know where you are.

| Step | What happens |
|------|-------------|
| **1. Environment check** | Verifies Node.js ≥ 18 and pnpm are available |
| **2. Clean AI files** | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.agents/` etc. and removes them, preserves your `.agents/skills/` |
| **3. Choose platform** | GitHub or Azure DevOps |
| **4. Check platform CLI** | Verifies `gh` (GitHub) or `az` + `azure-devops` (Azure DevOps) |
| **5. Copy scaffolding** | Drops agents, skills, and bootstrap docs into your project |
| **6. Init OpenSpec** | Runs `npx @fission-ai/openspec init` silently for structured change management |
| **7. Install skills** | Installs built-in `ob-` skills + optional additional skills provider |
| **8. Choose models** | Fetches live model list from [models.dev](https://models.dev), lets you pick plan / build / fast models with cost indicators and canonical pricing |
| **9. Check RTK** | Verifies `rtk` is on PATH |
| **10. Install browser plugin** | Installs `@different-ai/opencode-browser` globally for agent browser automation |

When it finishes, open OpenCode in your project and type:

```
init
```

OpenCode generates `ARCHITECTURE.md` and `DESIGN.md` from your actual codebase, then activates the full agent team.

---

## Agents and Skills

opencode-onboard draws a hard line between two concepts:

### Agents, universal behaviors

Agents define *how to work*. They are behavioral personas, the same for every project, every tech stack, every team. You never configure them or choose between them. All six are always installed.

```
devops-manager     reads work items, creates PRs, handles review feedback
front-engineer     web, mobile, UI, anything visual
back-engineer      APIs, services, data, AI, anything not UI
infra-engineer     Terraform, pipelines, cloud infrastructure
quality-engineer   unit, integration, e2e tests across all layers
security-auditor   vulnerability audit, secrets, auth gaps
```

Each agent has a color in the OpenCode UI. Builder agents (`front-engineer`, `back-engineer`, `infra-engineer`) run at `temperature: 0.2` for deterministic output. `security-auditor` is read-only, edit is denied.

### Skills, platform knowledge

Skills define *what to know*. They provide the tech and platform-specific knowledge agents need. Agents detect and load relevant skills automatically, **you never tell an agent which skill to use**.

Built-in skills (`ob-` prefix) shipped with opencode-onboard:

| Skill | Purpose |
|-------|---------|
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

When you give the lead agent a work item URL, it runs the full pipeline automatically:

```
devops-manager  →  parse work item via skill  →  structured summary
                                ↓
                         openspec-propose
                    proposal + specs + tasks
                                ↓
                        [confirm with user]
                                ↓
   front-engineer  +  back-engineer  +  infra-engineer   (parallel)
                                ↓
                        quality-engineer
                    tests, build, lint, acceptance
                                ↓
                        security-auditor
                      vulnerabilities, secrets
                                ↓
devops-manager  →  screenshots  →  commit  →  push  →  PR  →  comment
```

Each agent runs in its own isolated git worktree via [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), with a live dashboard at `http://localhost:4747`.

---

## What gets installed

```
your-project/
├── AGENTS.md                        ← bootstrap mode, replaced after first "init"
├── ARCHITECTURE.md                  ← prompt for agents to fill in from your codebase
├── DESIGN.md                        ← prompt for agents to fill in from your codebase
├── .opencode/
│   └── opencode.json                ← plan model + plugins configured
└── .agents/
    ├── agents/
    │   ├── devops-manager.md
    │   ├── front-engineer.md
    │   ├── back-engineer.md
    │   ├── infra-engineer.md
    │   ├── quality-engineer.md
    │   └── security-auditor.md
    └── skills/
        ├── browser-automation/
        ├── ob-userstory-gh/         ← or -az, depending on platform
        └── ob-userstory-az/
```

---

## The bootstrap sequence

The first time you type `init` in OpenCode after onboarding:

1. OpenCode reads your codebase and writes a real `ARCHITECTURE.md`
2. OpenCode reads your design patterns and writes a real `DESIGN.md`
3. `AGENTS.md` is replaced by the production version
4. Your agent team is live

After this, every agent has accurate, persistent context about your project, no manual documentation required.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js 18+** | Required |
| **[OpenCode](https://opencode.ai)** | The agent runtime |
| **[OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble)** | Multi-agent parallel execution |
| **[rtk](https://github.com/rtk-ai/rtk#pre-built-binaries)** | Required for agents to run CLI commands safely |
| **[gh CLI](https://cli.github.com)** | GitHub platform, must be authenticated |
| **[az CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)** + azure-devops extension | Azure DevOps platform |

---

## Development

```bash
git clone https://github.com/ckgrafico/opencode-onboard.git
cd opencode-onboard
pnpm install

# Run the CLI locally
node src/index.js

# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

Tests are written with [Vitest](https://vitest.dev).

---

## License

MIT © [ckgrafico](https://github.com/ckgrafico)

<!--
  BANNER
  Replace the line below with your actual banner image once ready.
  Recommended size: 1280×640px, dark background.
  <img src="./assets/banner.png" alt="opencode-onboard banner" width="100%" />
-->

<div align="center">

# opencode-onboard

**One command to prepare any codebase for AI agent workflows.**

Works with [OpenCode](https://opencode.ai), [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), [OpenSpec](https://github.com/fission-ai/openspec), GitHub and Azure DevOps.

[![npm version](https://img.shields.io/npm/v/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![npm downloads](https://img.shields.io/npm/dm/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![license](https://img.shields.io/npm/l/opencode-onboard?style=flat-square&color=black)](./LICENSE)
[![node](https://img.shields.io/node/v/opencode-onboard?style=flat-square&color=black)](https://nodejs.org)

</div>

---

## What is this?

Most codebases have no `AGENTS.md`, no architecture docs agents can read, and no defined workflow for picking up tasks. Agents end up improvising, and that produces inconsistent, brittle results.

**opencode-onboard** fixes that in a single interactive run. It installs a universal agent team and the skills they need to work on your project, platform-aware, non-destructive, and ready the moment it finishes.

> **Note:** This is an independent community tool, not built by or affiliated with the OpenCode team.

---

## Quick start

```bash
npx opencode-onboard@latest
```

Requires **Node.js 18+**.

---

## How it works

The CLI runs through a short interactive sequence:

| Step | What happens |
|------|-------------|
| **1. Environment check** | Verifies Node.js ≥ 18 and npm/pnpm are available |
| **2. Clean AI files** | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, etc. and offers to remove them |
| **3. Choose platform** | GitHub or Azure DevOps |
| **4. Copy scaffolding** | Drops the agent layer and bootstrap docs into your project |
| **5. Choose skills provider** | Installs platform skills agents use for work item and PR workflows |
| **6. Init OpenSpec** | Runs `npx @fission-ai/openspec init` for structured change management |
| **7. Install opencode-browser** | Browser plugin agents use for local UI screenshots |
| **8. Check rtk** | Verifies `rtk` is on PATH |
| **9. Verify platform CLI** | Checks `gh` (GitHub) or `az` + `azure-devops` (Azure DevOps) |

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

### Skills, platform knowledge

Skills define *what to know*. They are installed separately and provide the tech and platform-specific knowledge agents need. Agents detect and load relevant skills automatically, **you never tell an agent which skill to use**.

Skills shipped with opencode-onboard (`ob-` prefix):

| Skill | Purpose |
|-------|---------|
| `ob-userstory-gh` | Parse a GitHub Issue URL into a structured work item |
| `ob-userstory-az` | Parse an Azure DevOps work item URL |
| `ob-pullrequest-gh` | Create and update PRs on GitHub |
| `ob-pullrequest-az` | Create and update PRs on Azure DevOps |

Skills are plain Markdown files in `.opencode/skills/`. You can write your own, any file with a `SKILL.md` in a subdirectory is automatically discoverable by agents.

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
├── AGENTS.md                     ← bootstrap mode, replaced after first "init"
├── ARCHITECTURE.md               ← prompt for agents to fill in from your codebase
├── DESIGN.md                     ← prompt for agents to fill in from your codebase
└── .opencode/
    ├── agents/
    │   ├── devops-manager.md
    │   ├── front-engineer.md
    │   ├── back-engineer.md
    │   ├── infra-engineer.md
    │   ├── quality-engineer.md
    │   └── security-auditor.md
    └── skills/
        ├── ob-userstory-gh/      ← or -az, depending on platform
        └── ob-pullrequest-gh/
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

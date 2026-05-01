<!--
  BANNER
  Replace the line below with your actual banner image once ready.
  Recommended size: 1280×640px, dark background.
  <img src="./assets/banner.png" alt="opencode-onboard banner" width="100%" />
-->

<div align="center">

# opencode-onboard

**One command to prepare any brownfield codebase for AI agent workflows.**

Works with [OpenCode](https://opencode.ai), [OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble), [OpenSpec](https://github.com/fission-ai/openspec), GitHub and Azure DevOps.

[![npm version](https://img.shields.io/npm/v/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![npm downloads](https://img.shields.io/npm/dm/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![license](https://img.shields.io/npm/l/opencode-onboard?style=flat-square&color=black)](./LICENSE)
[![node](https://img.shields.io/node/v/opencode-onboard?style=flat-square&color=black)](https://nodejs.org)

</div>

---

## What is this?

Most codebases weren't built with AI agents in mind. There's no `AGENTS.md`, no architecture docs the agents can read, no defined team, and no workflow for picking up tasks from GitHub Issues or Azure DevOps.

**opencode-onboard** fixes that in a single interactive run. It scaffolds the full AI agent layer on top of any existing project — platform-aware, non-destructive, and ready to use with OpenCode the moment it finishes.

> **Note:** This project is an independent community tool. It is not built by or affiliated with the OpenCode team.

---

## Quick start

```bash
npx opencode-onboard@latest
```

Requires **Node.js 18+** and **npm** or **pnpm**.

---

## How it works

The CLI walks you through 9 steps — interactive, resumable, and safe to run on an existing project.

| Step | What happens |
|------|-------------|
| **1. Environment check** | Verifies Node.js ≥ 18 and npm/pnpm are available |
| **2. Clean AI files** | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, etc. and offers to remove them |
| **3. Choose platform** | GitHub or Azure DevOps — controls which agent skills are installed |
| **4. Copy scaffolding** | Drops the full agent layer into your project root, filtered by platform |
| **5. Choose your team** | Pick agent roles from a menu — `frontend`, `backend`, `tester` — or add custom names |
| **6. Init OpenSpec** | Runs `npx @fission-ai/openspec init` to set up structured change management |
| **7. Install opencode-browser** | Installs the browser plugin agents use to interact with web UIs |
| **8. Check rtk** | Verifies `rtk` is on PATH (required for agents to run CLI commands safely) |
| **9. Verify platform CLI** | Checks `gh` auth status (GitHub) or `az` + `azure-devops` extension (Azure DevOps) |

When it finishes:

```
Open OpenCode in this project and type: "init"
```

OpenCode will generate `ARCHITECTURE.md` and `DESIGN.md` from your actual codebase, then activate the full agent team.

---

## What gets installed

```
your-project/
├── AGENTS.md                              ← bootstrap mode — self-destructs after first "init"
├── ARCHITECTURE.md                        ← prompt — agents generate this from your codebase
├── DESIGN.md                              ← prompt — agents generate this from your codebase
└── .opencode/
    ├── agents/
    │   ├── frontend.md                    ← empty skeleton, yours to fill
    │   ├── backend.md
    │   ├── tester.md
    │   └── <custom>.md
    └── skills/
        ├── ob-userstory-gh/
        ├── ob-pullrequest-creator-gh/
        └── ob-pullrequest-observer-gh/
```

> For **Azure DevOps**, `-gh` skills are replaced with `-az` equivalents that work with boards and pull requests.

The `.opencode/agents/` files are intentionally empty templates — open them and describe your actual stack so agents know exactly what they're working with.

---

## Agent team

During setup you pick which roles exist in your project. opencode-onboard creates an **empty skeleton file** for each one at `.opencode/agents/<name>.md` — nothing more.

The content is entirely yours to write. Open each file and describe your stack, conventions, and constraints. The richer the description, the better the agents perform.

| Agent | Role |
|-------|------|
| `frontend` | UI / frontend implementation |
| `backend` | API / backend implementation |
| `tester` | Testing & QA |
| _custom_ | Any name you type during setup |

---

## Platform support

opencode-onboard installs different skills depending on your platform choice.

### GitHub

| Skill | What it does |
|-------|-------------|
| `ob-userstory-gh` | Parses a GitHub Issue URL and creates an OpenSpec change with design, spec, and tasks |
| `ob-pullrequest-creator-gh` | Opens a pull request from a completed OpenSpec change |
| `ob-pullrequest-observer-gh` | Monitors PR status, surfaces review comments, and closes the loop |

### Azure DevOps

| Skill | What it does |
|-------|-------------|
| `ob-userstory-az` | Parses an Azure DevOps work item URL and creates an OpenSpec change |
| `ob-pullrequest-creator-az` | Opens a pull request in Azure Repos from a completed change |
| `ob-pullrequest-observer-az` | Monitors PR status and review feedback |

---

## The bootstrap sequence

The first time you open OpenCode after onboarding and type `init`, this happens automatically:

1. `AGENTS.md` (bootstrap mode) activates and guides OpenCode through the sequence
2. OpenCode reads your actual codebase and writes a real `ARCHITECTURE.md`
3. OpenCode reads your design patterns and writes a real `DESIGN.md`
4. `AGENTS.md` is replaced by the production version from the template
5. Your agent team is live and ready to take tasks

After this, your project has persistent, accurate context that every agent can read — no manual documentation required.

---

## Works with OpenCode Ensemble

[OpenCode Ensemble](https://github.com/hueyexe/opencode-ensemble) is an OpenCode plugin that runs your agent team in parallel — each agent in its own session, its own git worktree, coordinated through messaging and a shared task board.

opencode-onboard sets up the skeleton. Ensemble runs it.

Once onboarding is done, install Ensemble in your `opencode.json`:

```json
{
  "plugin": ["@hueyexe/opencode-ensemble@latest"]
}
```

Then ask OpenCode to spawn your team on a task. Ensemble picks up the agent files from `.opencode/agents/`, gives each one an isolated branch, and coordinates the work — with a live dashboard at `http://localhost:4747`.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js 18+** | Required |
| **npm or pnpm** | Either works |
| **[OpenCode](https://opencode.ai)** | The agent runtime this scaffolding targets |
| **[rtk](https://github.com/rtk-ai/rtk#pre-built-binaries)** | Required for agents to run CLI commands safely. Install separately. |
| **[gh CLI](https://cli.github.com)** | GitHub platform only — must be authenticated (`gh auth login`) |
| **[az CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)** + azure-devops extension | Azure platform only |

---

## Customising presets

Agent roles and platforms are defined in plain JSON files — no code changes needed.

```
src/presets/
├── agents.json      ← add/rename/remove agent roles
└── platforms.json   ← add/rename platforms
```

---

## Development

```bash
git clone https://github.com/ckgrafico/opencode-onboard.git
cd opencode-onboard
pnpm install

# Run the CLI locally against any project
node src/index.js

# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

Tests are written with [Vitest](https://vitest.dev) and cover all steps and utilities.

---

## License

MIT © [ckgrafico](https://github.com/ckgrafico)

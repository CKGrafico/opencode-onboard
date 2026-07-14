<div align="center">

<img src="https://raw.githubusercontent.com/CKGrafico/opencode-onboard/refs/heads/main/logo.png" alt="opencode-onboard" width="160" />

# 🧰 opencode-onboard

**Prepare any codebase for AI. Wires [OpenCode](https://opencode.ai), [OpenSpec](https://github.com/fission-ai/openspec), [codegraph](https://github.com/colbymchenry/codegraph), and [basic-memory](https://github.com/basicmachines-co/basic-memory) into a multi-agent development workflow powered by native parallel subagents.**

GitHub, Azure DevOps, Jira, GitLab, browser-based backlog, or combinations (e.g. Jira backlog + GitHub repo, Others (Browser) + GitLab repo).

**[opencode.ckgrafico.com](https://opencode.ckgrafico.com)**

[![npm version](https://img.shields.io/npm/v/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![npm downloads](https://img.shields.io/npm/dm/opencode-onboard?style=flat-square&color=black)](https://www.npmjs.com/package/opencode-onboard)
[![license](https://img.shields.io/npm/l/opencode-onboard?style=flat-square&color=black)](./LICENSE)
[![node](https://img.shields.io/node/v/opencode-onboard?style=flat-square&color=black)](https://nodejs.org)

</div>

## What is this?

Most codebases have no `AGENTS.md`, no architecture docs agents can read, and no defined workflow for picking up tasks. Agents end up improvising, producing inconsistent results.

**opencode-onboard** fixes that in a single interactive wizard. It configures OpenCode with OpenSpec for structured change management, native subagent waves for parallel agent execution, codegraph for code intelligence, and basic-memory for shared context across agent sessions. It also installs an agent team, platform skills, and slash commands — everything agents need to plan, implement, and ship.

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
- Run `optimization` if you want to reconfigure RTK/quota/caveman and the AGENTS.md optimization markers
- Run `metadata` last to refresh `.opencode/opencode-onboard.json`
- Run `join` if you're a new member of an existing onboarded project and want to sync the latest onboarding metadata

---

## How it works

The CLI runs a 10-step onboarding wizard. It keeps the current step visible, plus the last two completed steps, so progress is always clear.

| Step                              | What happens                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Source scope**               | Choose current repo or sibling source roots for code analysis                                                                                                        |
| **2. Clean AI files**             | Detects existing `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.agents/` etc. and removes them, preserves your `.agents/skills/`                                        |
| **3. Choose platform**            | Backlog (GitHub / Azure DevOps / Jira / Others (Browser) / None) + repo (GitHub / Azure DevOps / GitLab / None). Supports mixed platforms e.g. browser backlog + GitHub repo, Jira backlog + GitLab repo
| **4. Check platform CLI**         | Verifies `gh` (GitHub) or `az` + `azure-devops` (Azure DevOps) or `acli` (Jira) or `glab` (GitLab). Skips CLI checks for Others (Browser) or None |
| **5. Copy scaffolding**           | Copies agents + built-in skills + bootstrap docs, writes source-roots metadata, applies AGENTS bootstrap patching, copies `skills-lock.json`, then runs `npx skills` |
| **6. Init OpenSpec**              | Runs `npx @fission-ai/openspec init` silently for structured change management                                                                                       |
| **7. Choose models**              | Fetches live model list from [models.dev](https://models.dev), lets you pick plan / build / fast models with cost indicators and canonical pricing                   |
| **8. Token optimization tools**   | Optional (recommended). One checklist step for RTK check, opencode-quota setup, caveman install, and token-optimization rule injection into AGENTS.md + command files |
| **9. Install browser plugin**     | Installs `@different-ai/opencode-browser` globally for agent browser automation                                                                                      |
| **10. Write onboarding metadata** | Writes `.opencode/opencode-onboard.json` with selected setup details                                                                                                 |

When it finishes, open OpenCode in your project and type:

```
/repo-initialize
```

OpenCode asks if this is a greenfield or brownfield project. For brownfield projects it generates `ARCHITECTURE.md` and `DESIGN.md` from your actual codebase, archives project history, then activates the full agent team. For greenfield projects it skips doc generation and leaves placeholder files you can populate later with `/make-architecture` and `/make-design`.

---

## Commands

Custom slash commands are installed into `.opencode/commands/` and are available directly in OpenCode.

| Command | Description |
| ------- | ----------- |
| `/repo-help` | Show all commands and when to use each one. Start here if you're unsure. |
| `/repo-onboard` | Guided tour of the project and its agentic infrastructure. Explains agents, commands, skills, OpenSpec workflow, and configuration. Read-only. |
| `/repo-initialize` | Initialize the project. Asks greenfield vs brownfield, then activates the agent team. |
| `/plan-explore` | Think through an idea or investigate a problem before committing to a plan. |
| `/plan-propose <url or idea>` | Parse a GitHub Issue / Azure DevOps / Jira / browser URL or a direct idea into a structured plan (proposal, specs, tasks). Enriches each task with agent and model assignments. |
| `/plan-simple <task>` | Quick plan for focused changes. Reads the codebase, creates a task checklist, and stops. No OpenSpec, no proposals, no specs. |
| `/plan-apply` | Implement tasks from the current plan. Detects format automatically: OpenSpec-annotated tasks run as parallel subagent waves; plain checkboxes run sequentially in-session. |
| `/plan-pr` | Create a PR for the current branch, or read and classify PR review comments. |
| `/plan-archive` | Archive a completed OpenSpec change. |
| `/plan-goal <feature or URL>` | Autonomous, no-confirmation pipeline: branch off `main`, then propose → apply → archive (one commit per phase). Default: merge to `main` + delete branch. Add `push` keyword to push branch only. Add `pr` keyword to push + create a PR. For loop-engineering. |
| `/make-engineer` | Interactive persona-driven flow to add a custom specialist engineer. Pick a persona, answer questions about your stack, and skills are installed automatically. |
| `/make-architecture` | Generate or regenerate `ARCHITECTURE.md` from the codebase. |
| `/make-design` | Generate or regenerate `DESIGN.md` from the design system. |
| `/make-guardrails` | Generate a `project-guardrails` skill from `ARCHITECTURE.md` + project config files. Extracts architecture boundaries, naming, code style, testing, and git workflow rules. Updates all `*-engineer.md` to load the skill. |
| `/make-user-model [user] <tier> <model>` | Set the model for a tier (`plan`, `build`, `fast`). Writes to `opencode-onboard.json` (team) or `opencode-onboard.user.json` (user override, gitignored) when `user` prefix is used. Restart to pick up — the `ob-subagent-tiers` plugin rebuilds tier agents at startup. Pass a model id or `current` for the active session model. |

---

## Agents and Skills

opencode-onboard draws a hard line between two concepts:

### Agents, universal behaviors

Agents define _how to work_. They are universal personas (same behavior across projects and stacks).

Current baseline uses a generic execution model:

```
lead     lead/orchestrator, planning, PR lifecycle
fullstack-engineer     implementation worker, ability-driven
```

`fullstack-engineer` behavior is composed by abilities, not hardcoded role silos.
Project-specific specialization comes from user-created custom engineers via `/make-engineer`. During `/plan-apply`, the lead should inspect the engineers that actually exist in `.opencode/agents/`, prefer matching custom engineers, and fall back to `fullstack-engineer` only when no specialist is a clear fit.

### Skills, platform knowledge

Skills define _what to know_. They provide project rules, platform behavior, and task-specific execution guidance. Agents auto-detect/load relevant skills; **you do not manually choose skills per prompt**.

If you choose backlog platform `None`, no userstory skills are injected into the workflow. The project works from direct conversation, local repo context, and optional OpenSpec artifacts only. If you choose repo platform `None`, no pull-request skills are injected.

Current loading model:

- `ob-generic-guardrails` is mandatory baseline for every agent (git/secrets/quality rules + the engineer workflow)
- `ob-default` is fallback when nothing else matches
- Baseline context rules and token-optimization guidance live in `AGENTS.md` (always in context), not in a skill

Default `fullstack-engineer` abilities:

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
| `ob-default`            | Fallback, when no other skill matches                                                                            |
| `ob-generic-guardrails` | Foundation for user guardrails skills                                                                            |
| `ob-userstory-gh`       | Parse a GitHub Issue URL into a structured work item                                                             |
| `ob-userstory-az`       | Parse an Azure DevOps work item URL                                                                              |
| `ob-userstory-jira`     | Parse a Jira issue URL via `acli` CLI                                                                            |
| `ob-userstory-browser`  | Parse work item from any URL via browser automation (Linear, Trello, etc.)                                       |
| `ob-pullrequest-gh`     | Create GitHub PRs with screenshots, triage review feedback                                                      |
| `ob-pullrequest-az`     | Create Azure DevOps PRs, triage review feedback                                                                 |
| `ob-pullrequest-gl`     | Create GitLab merge requests, triage review feedback                                                             |
| `browser-automation`    | Browser control via `@different-ai/opencode-browser` (localhost + browser backlog exception)                    |

Skills live in `.agents/skills/`. Any `SKILL.md` file in a subdirectory is automatically discoverable, write your own and agents will pick them up.

### Models, plan / build / fast

During onboarding you pick three models:

| Role      | Used by                                | Pick                                    |
| --------- | -------------------------------------- | --------------------------------------- |
| **plan**  | Main OpenCode session (the lead)       | Something capable with strong reasoning |
| **build** | Specialist engineers (default tier)    | Something capable for implementation    |
| **fast**  | `fullstack-engineer` & light helpers       | Something fast and cheap                |

Models are fetched live from [models.dev](https://models.dev) (3000+ models, cached weekly). Cost tiers `[$]` `[$$]` `[$$$]` always reflect the canonical provider price, so `github-copilot/claude-opus-4.7` shows `[$$]` not `[$]`.

---

## The pipeline

When you give the lead agent a work item URL, execution follows this pipeline. If backlog platform is `None`, skip the work item stage. If repo platform is `None`, skip the PR stage:

```
lead
                  ↓
         parse work item via userstory skill
                  ↓
              openspec-propose
        proposal + specs + tasks
                  ↓
             [confirm with user]
                  ↓
 wave of subagents (fullstack-engineer / *-engineer, per-tier model)
 each implements its assigned tasks → returns result → lead commits group
                  ↓
       verify (tests/build/lint as needed)
                  ↓
    lead (ship mode, if configured)
  commit → push → PR → feedback loop
```

1. Load the platform userstory skill (installed as `ob-userstory`, from the variant matching your backlog platform)
2. Run `/plan-propose` to produce `proposal.md`, specs, and `tasks.md`
3. Confirm with user before implementation
4. Run `/plan-apply` to orchestrate implementation in waves
5. Each wave spawns engineers in parallel (`fullstack-engineer` and/or custom engineers, each carrying its own tier model), capped at `agents.maxConcurrent`
6. Each subagent receives its task IDs in its prompt, loads relevant abilities, implements, and returns; the lead commits each group
7. Verify with tests/build/lint according to task scope
8. Ship/update PR via lead flow

Agents run as native OpenCode subagents in parallel waves — no external plugin, no git worktrees. The lead's Todo pane is the live board, and the `ob-subagent-monitor` plugin mirrors state to `.opencode/.ob-run.json`. Navigate into any running subagent with `ctrl+x ↓` then `←`/`→`.

---

## What gets installed

```
your-project/
├── AGENTS.md                        ← bootstrap mode, replaced after first "/repo-initialize"
├── ARCHITECTURE.md                  ← prompt for agents to fill in from your codebase
├── DESIGN.md                        ← prompt for agents to fill in from your codebase
├── .opencode/
│   ├── opencode.json                ← default model + plugin config
│   ├── opencode-onboard.json        ← onboarding metadata + runtime config (models, maxConcurrentAgents)
│   ├── agents/                      ← fullstack-engineer + user-created *-engineer files (each carries its model)
│   ├── tui.json                     ← registers the Subagents sidebar panel
│   ├── tui/
│   │   └── ob-subagents.tsx         ← TUI plugin: live Subagents panel in the sidebar
│   └── plugins/
│       └── ob-subagent-monitor.js   ← server plugin: writes subagent state → .opencode/.ob-run.json
└── .agents/
    └── skills/
        ├── ob-default/             ← fallback skill
        ├── ob-generic-guardrails/  ← foundation for user guardrails
        ├── ob-userstory/           ← the variant matching your backlog platform, renamed on install
        ├── ob-pullrequest/         ← the variant matching your repo platform, renamed on install
        └── browser-automation/
```

Platform skills ship as suffixed variants (`ob-userstory-gh/-az/-jira/-browser`, `ob-pullrequest-gh/-az/-gl`) and the installer copies only the matching one, renamed to its generic name. Source-roots metadata lands in `.opencode/source-roots.json`; token-optimization guidance is injected into AGENTS.md marker blocks during onboarding.

---

## The bootstrap sequence

The first time you type `init` in OpenCode after onboarding, the agent asks whether this is a **greenfield** or **brownfield** project:

### Brownfield (existing codebase)

1. Bootstrap-mode `AGENTS.md` triggers the initialization workflow
2. OpenCode archives existing project context into OpenSpec (`project-history`)
3. OpenCode runs `/make-architecture` → generates real `ARCHITECTURE.md` from your codebase
4. OpenCode runs `/make-design` → generates real `DESIGN.md` from your design system
5. OpenSpec `config.yaml` is populated with discovered tech stack and domain context
6. Bootstrap `AGENTS.md` is replaced with production guidance
7. Team workflows become fully active for normal implementation tasks

### Greenfield (new project, little or no existing code)

1. Bootstrap-mode `AGENTS.md` triggers the initialization workflow
2. OpenSpec `config.yaml` is populated with what is known (intended stack, domain)
3. Bootstrap `AGENTS.md` is replaced with production guidance
4. `ARCHITECTURE.md` and `DESIGN.md` are left as placeholder files

Once your codebase has meaningful content, run:
- `/make-architecture` to generate architecture docs
- `/make-design` to generate design system docs

Both commands are safe to rerun at any time as the project evolves.

---

## Token Budget Controls

Long unattended agent sessions can consume significant tokens. Set these controls up **before** first use:

1. **Set provider-side limits first** — monthly soft-limit + hard usage cap in your provider dashboard:
   - OpenAI: [platform.openai.com/account/limits](https://platform.openai.com/account/limits)
   - Anthropic: [console.anthropic.com](https://console.anthropic.com)
   - Google AI Studio: [aistudio.google.com/app/usage](https://aistudio.google.com/app/usage)

2. **Route models by task type** — use a fast/cheap model (e.g. `haiku`, `gpt-4o-mini`) for orchestration and status loops; reserve expensive models (e.g. `sonnet`, `opus`, `gpt-4o`) for implementation tasks only.

3. **Install the quota plugin** — the [`@slkiser/opencode-quota`](https://www.npmjs.com/package/@slkiser/opencode-quota) plugin adds `/quota` and `/quota_status` commands that surface real-time token usage inside OpenCode sessions.

4. **Use `/quota` checkpoints** — run `/quota` before starting any `/plan-apply` session and after each agent wave. Pause at 75% consumed; stop at 90%.

5. **Confirm before large runs** — the onboarded `/plan-apply` workflow will ask for your confirmation before spawning agents for Medium (4–7 tasks) or High (8+ tasks) scope sessions.

---

## Prerequisites

| Requirement                                                                                          | Notes                                  |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Node.js 18+**                                                                                      | Required                               |
| **[OpenCode](https://opencode.ai)**                                                                  | The agent runtime                      |
| **[gh CLI](https://cli.github.com)**                                                                 | GitHub platform, must be authenticated                                 |
| **[az CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)** + azure-devops extension | Azure DevOps platform                                                  |
| **[acli](https://developer.atlassian.com/cloud/acli/guides/install-acli/)**                           | Jira (Atlassian) backlog platform, must be authenticated               |
| **[glab](https://gitlab.com/gitlab-org/cli/#installation)**                                           | GitLab repo platform, must be authenticated                            |

---

## Development

Wizard choices and defaults live in `src/presets/` where possible:

- `source.json` controls source-scope prompt options
- `platforms.json` controls platform labels, CLI checks, and backlog-only flags
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

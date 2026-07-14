# Contributing to opencode-onboard

Thank you for your interest in contributing to opencode-onboard. This document explains how to set up your development environment, run tests, submit pull requests, and follow the project conventions.

## Development setup

### Prerequisites

- **Node.js 18 or higher** (check with `node --version`)
- **pnpm** as the package manager (install with `npm install -g pnpm` if needed)

### Get the code

```bash
git clone https://github.com/ckgrafico/opencode-onboard.git
cd opencode-onboard
pnpm install
```

### Run the wizard locally

```bash
node src/index.js
```

This starts the full 10-step onboarding wizard. You can also run individual steps:

```bash
node src/index.js clean
node src/index.js copy
node src/index.js models
```

### Run tests

```bash
pnpm test
```

Tests run with [Vitest](https://vitest.dev) in Node environment. Test files are co-located with their source files (named `*.test.js`). To run in watch mode:

```bash
pnpm test:watch
```

### Run linting

```bash
pnpm lint
```

To auto-fix fixable issues:

```bash
pnpm lint:fix
```

Linting uses ESLint 9 flat config with strict correctness rules. Key rules include `prefer-const`, `no-unused-vars` (with `^_` ignore pattern), `eqeqeq`, `object-shorthand`, and `prefer-template`.

## Architecture conventions

### Preset-driven design

All wizard options and defaults live in JSON files under `src/presets/`. This is the single source of truth for wizard behavior. If you need to add a new platform, model provider, or optimization tool, you usually only need to edit a JSON file in `src/presets/`, not the JavaScript code.

Key preset files:

| File | Controls |
| ---- | -------- |
| `src/presets/source.json` | Source-scope prompt options |
| `src/presets/platforms.json` | Platform labels, CLI checks, backlog-only flags |
| `src/presets/clean.json` | AI file detection and preservation rules |
| `src/presets/models.json` | Model role definitions and cost tiers |
| `src/presets/optimization.json` | Token optimization tool checklist and guidance |
| `src/presets/agents-content.json` | Platform-specific AGENTS.md content blocks |
| `src/presets/browser.json` | Browser plugin installer automation |
| `src/presets/quota.json` | Quota plugin defaults |

### Step module pattern

Each wizard step is a self-contained directory under `src/steps/` with an `index.js` exporting the main async function. Steps can be run individually via `npx opencode-onboard <step-name>`. When adding a new step, create a new directory under `src/steps/` and wire it into `src/commands/wizard.js`.

### Content templates

The `content/` directory contains template files that are copied to the user's project during onboarding. These templates evolve independently of the CLI code. Updates to command files, agent definitions, or skills should be made in `content/`, not in the source files directly.

### Marker-based patching

AGENTS.md, command files, and the guardrails skill use HTML comment markers (for example `<!-- OB-RTK-START -->` and `<!-- OB-RTK-END -->`) for targeted content injection during onboarding. When adding new patchable content, use this marker pattern so the patcher can replace it on re-runs.

### ESM modules

The entire codebase uses ES modules (`"type": "module"` in `package.json`). Use `import` and `export`, not `require`. Top-level `await` is used in step modules to load preset JSON files at module scope.

## Pull request process

1. **Fork and branch**: create a feature branch from `main` (for example `feature/add-new-platform` or `fix/wizard-crash`)
2. **Write tests**: every new feature or bug fix must include tests in a `*.test.js` file co-located with the source
3. **Run lint and tests**: `pnpm lint && pnpm test` must pass before submitting
4. **Keep changes focused**: one pull request should address one concern. If you have multiple unrelated changes, submit separate pull requests
5. **Commit message style**: use a short imperative summary (for example `Add GitLab backlog platform support` or `Fix model cache fallback on network failure`). No abbreviations in commit messages.
6. **Update documentation**: if your change adds a new command, step, or platform, update `README.md` and any relevant preset files

### Commit message format

Use a clear, descriptive sentence in imperative mood. Examples:

- `Add agentmemory as alternative to basic-memory`
- `Fix platform resolution when backlog and repo differ`
- `Update optimization checklist labels for new tool names`

Do not use conventional-commit prefixes (no `feat:`, `fix:`, `chore:`). Just the description.

## Project structure

```
opencode-onboard/
├── src/
│   ├── index.js              ← CLI entry point
│   ├── commands/             ← Top-level command handlers (wizard, single, join)
│   ├── steps/                ← One directory per wizard step
│   ├── presets/              ← JSON configuration for each step
│   └── utils/                ← Shared utilities (exec, copy, models, terminal)
├── content/                  ← Template files copied to user projects
│   ├── .opencode/            ← Agents, commands, plugins, config templates
│   ├── .agents/              ← Skill templates
│   ├── AGENTS.md             ← Bootstrap AGENTS.md template
│   ├── ARCHITECTURE.md       ← Placeholder
│   ├── DESIGN.md             ← Placeholder
│   └── skills-lock.json      ← Template skill lockfile
├── docs/                     ← GitHub Pages landing page
├── test/                     ← Additional test utilities
├── package.json
├── eslint.config.js
├── jsconfig.json
└── pnpm-lock.yaml
```

## Reporting issues

- **Bugs**: open a GitHub issue with the steps to reproduce, your Node.js version, and your operating system
- **Feature requests**: open a GitHub issue describing the use case and the expected behavior
- **Security vulnerabilities**: see [SECURITY.md](./SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

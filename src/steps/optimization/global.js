import fse from 'fs-extra'
import path from 'node:path'
import { info, success, warn } from '../../utils/exec.js'

const SOURCE_START = '<!-- OB-SOURCE-ROOTS-START -->'
const SOURCE_END = '<!-- OB-SOURCE-ROOTS-END -->'
const RTK_START = '<!-- OB-RTK-START -->'
const RTK_END = '<!-- OB-RTK-END -->'
const CAVEMAN_START = '<!-- OB-CAVEMAN-START -->'
const CAVEMAN_END = '<!-- OB-CAVEMAN-END -->'

const CODEGRAPH_START = '<!-- OB-CODEGRAPH-START -->'
const CODEGRAPH_END = '<!-- OB-CODEGRAPH-END -->'

function relRoot(cwd, abs) {
  const rel = path.relative(cwd, abs).replace(/\\/g, '/')
  return rel || '.'
}

function buildSourceRootsSection(sourceRoots, cwd) {
  const roots = Array.isArray(sourceRoots) && sourceRoots.length > 0 ? sourceRoots : [cwd]
  const bullets = roots.map(r => `- \`${relRoot(cwd, r)}\``).join('\n')
  const multiRepo = roots.length > 1
    ? '\nEach root is an independent git repository. For branch/commit/push workflows, run git operations per repository. There is no single shared git history across all roots.\n'
    : ''

  return `Read and analyze code ONLY from these roots:\n\n${bullets}\n${multiRepo}`
}

function buildRtkSection(rtkEnabled) {
  if (!rtkEnabled) return 'RTK was not selected during onboarding. Do not assume `rtk` exists.'
  return [
    '## RTK, MANDATORY',
    '',
    'RTK has NO automatic hook in OpenCode. You MUST explicitly prefix every CLI command with `rtk`. It does not happen automatically.',
    '',
    'Prefix ALL shell commands with `rtk`:',
    '- `rtk git diff` NOT `git diff`',
    '- `rtk git log` NOT `git log`',
    '- `rtk gh` NOT `gh`',
    '- `rtk az` NOT `az`',
    '- `rtk openspec` NOT `openspec`',
    '- `rtk npx tsc --noEmit` NOT `npx tsc --noEmit`',
    '- `rtk pnpm build` NOT `pnpm build`',
    '- `rtk pnpm test` NOT `pnpm test`',
    '- `rtk pnpm lint` NOT `pnpm lint`',
    '- `rtk dotnet build` NOT `dotnet build`',
    '',
    'Light read-only commands that produce minimal output (e.g. `cat`, `ls`, `Get-Content`, `Select-String`) do not need `rtk`.',
    '',
    'If `rtk` is not available, report blocker and stop CLI execution.',
  ].join('\n')
}

function buildCavemanSection(cavemanEnabled) {
  if (!cavemanEnabled) return 'Caveman was not selected during onboarding. Use normal concise style.'
  return `## Caveman\n\ncaveman mode. Active now. Every response. No revert unless user asks "stop caveman" or "normal mode".`
}

function buildCodegraphSection(codegraphEnabled) {
  if (!codegraphEnabled) return 'Codegraph was not selected during onboarding. Use standard grep/glob/read for code exploration.'
  return `## CodeGraph

This project has CodeGraph initialized (\`.codegraph/\` exists). Use it for all code exploration.

**NEVER call \`codegraph_explore\` or \`codegraph_context\` directly in the main session** — these return large source payloads that fill context. Instead, ALWAYS spawn an Explore sub-agent for exploration questions ("how does X work?", "where is Y implemented?").

When spawning Explore agents, include in the prompt:
> This project has CodeGraph initialized. Use \`codegraph_explore\` as your PRIMARY tool. Do NOT re-read files that codegraph_explore already returned. Only fall back to grep/glob/read for files listed under "Additional relevant files".

**The main session may only use these lightweight tools directly** (targeted lookups before edits):
- \`codegraph_search\` — find symbols by name
- \`codegraph_callers\` / \`codegraph_callees\` — trace call flow
- \`codegraph_impact\` — check what's affected before editing
- \`codegraph_node\` — get a single symbol's details`
}


function replaceBetween(content, start, end, replacement) {
  if (!content.includes(start) || !content.includes(end)) return content
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  return content.replace(pattern, `${start}\n${replacement.trim()}\n${end}`)
}

export async function configureObGlobal(ctx = {}, tokenOpt = {}) {
  const cwd = process.cwd()
  const skillPath = path.join(cwd, '.agents', 'skills', 'ob-global', 'SKILL.md')

  if (!await fse.pathExists(skillPath)) {
    warn('ob-global skill not found, skipping dynamic configuration')
    return { configured: false }
  }

  const sourceRootsSection = buildSourceRootsSection(ctx.sourceRoots, cwd)
  const rtkSection = buildRtkSection(!!tokenOpt?.rtk?.optedIn)
  const cavemanSection = buildCavemanSection(!!tokenOpt?.caveman?.optedIn)
  const codegraphSection = buildCodegraphSection(!!tokenOpt?.codegraph?.optedIn)

  let content = await fse.readFile(skillPath, 'utf-8')
  content = replaceBetween(content, SOURCE_START, SOURCE_END, sourceRootsSection)
  content = replaceBetween(content, RTK_START, RTK_END, rtkSection)
  content = replaceBetween(content, CAVEMAN_START, CAVEMAN_END, cavemanSection)
  content = replaceBetween(content, CODEGRAPH_START, CODEGRAPH_END, codegraphSection)
  await fse.writeFile(skillPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  info('Configured ob-global from onboarding selections')
  success('ob-global skill updated')
  return { configured: true, path: skillPath }
}

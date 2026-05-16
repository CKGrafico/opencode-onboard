import fse from 'fs-extra'
import path from 'node:path'
import { info, success, warn } from '../../utils/exec.js'

const SOURCE_START = '<!-- OB-SOURCE-ROOTS-START -->'
const SOURCE_END = '<!-- OB-SOURCE-ROOTS-END -->'
const RTK_START = '<!-- OB-RTK-START -->'
const RTK_END = '<!-- OB-RTK-END -->'
const CAVEMAN_START = '<!-- OB-CAVEMAN-START -->'
const CAVEMAN_END = '<!-- OB-CAVEMAN-END -->'

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
  return `## RTK, MANDATORY\n\nUse \`rtk\` for ALL CLI commands. Never run commands directly.\n\n- \`rtk git\` NOT \`git\`\n- \`rtk gh\` NOT \`gh\`\n- \`rtk az\` NOT \`az\`\n- \`rtk openspec\` NOT \`openspec\`\n\nIf \`rtk\` is not available, report blocker and stop CLI execution.`
}

function buildCavemanSection(cavemanEnabled) {
  if (!cavemanEnabled) return 'Caveman was not selected during onboarding. Use normal concise style.'
  return `## Caveman\n\ncaveman mode. Active now. Every response. No revert unless user asks "stop caveman" or "normal mode".`
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

  let content = await fse.readFile(skillPath, 'utf-8')
  content = replaceBetween(content, SOURCE_START, SOURCE_END, sourceRootsSection)
  content = replaceBetween(content, RTK_START, RTK_END, rtkSection)
  content = replaceBetween(content, CAVEMAN_START, CAVEMAN_END, cavemanSection)
  await fse.writeFile(skillPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  info('Configured ob-global from onboarding selections')
  success('ob-global skill updated')
  return { configured: true, path: skillPath }
}

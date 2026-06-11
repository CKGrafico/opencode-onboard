import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentsContent = await fse.readJson(path.resolve(__dirname, '../../presets/agents-content.json'))

const STEP1_HEADING = '### Step 1, Archive project history into OpenSpec'
const STEP2_HEADING = '### Step 2, Generate DESIGN.md'
const STEP3_HEADING = '### Step 3, Generate ARCHITECTURE.md'

const STEP1_CONFIRM_LINE = '- Project history archived in openspec'
const STEP2_CONFIRM_LINE = '- DESIGN.md generated'
const STEP3_CONFIRM_LINE = '- ARCHITECTURE.md generated'

function removeStepBlock(content, heading) {
  const lines = content.split('\n')
  const start = lines.findIndex(l => l.trim() === heading.trim())
  if (start === -1) return content

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break }
  }

  if (end === -1) return content

  const removeFrom = start > 0 && lines[start - 1].trim() === '' ? start - 1 : start
  lines.splice(removeFrom, end - removeFrom + 1)
  return lines.join('\n')
}

function removeConfirmLine(content, line) {
  return content.split('\n').filter(l => l.trim() !== line.trim()).join('\n')
}

function renumberSteps(content) {
  let counter = 0
  return content.replace(/^### Step \d+,/gm, () => `### Step ${++counter},`)
}

const PLATFORM_WORKFLOW_START = '<!-- OB-PLATFORM-WORKFLOW-START -->'
const PLATFORM_WORKFLOW_END = '<!-- OB-PLATFORM-WORKFLOW-END -->'
const PLATFORM_PIPELINE_START = '<!-- OB-PLATFORM-PIPELINE-START -->'
const PLATFORM_PIPELINE_END = '<!-- OB-PLATFORM-PIPELINE-END -->'
const PLATFORM_SKILLS_GUIDE_START = '<!-- OB-PLATFORM-SKILLS-GUIDE-START -->'
const PLATFORM_SKILLS_GUIDE_END = '<!-- OB-PLATFORM-SKILLS-GUIDE-END -->'

function platformContent(platform, key) {
  const p = agentsContent.platform[platform] ?? agentsContent.platform.github
  return p[key] ?? ''
}

function replaceBetween(content, start, end, replacement) {
  if (!content.includes(start) || !content.includes(end)) return content
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  return content.replace(pattern, `${start}\n${replacement.trim()}\n${end}`)
}

const CONCURRENCY_PLACEHOLDER = '{{MAX_CONCURRENT_AGENTS}}'
const DEFAULT_MAX_CONCURRENT_AGENTS = 4

export async function patchConcurrency(ctx) {
  const maxAgents = String(ctx.maxConcurrentAgents ?? DEFAULT_MAX_CONCURRENT_AGENTS)
  const cwd = process.cwd()

  const filesToPatch = ['AGENTS.md']

  let patched = 0
  for (const rel of filesToPatch) {
    const abs = path.join(cwd, rel)
    if (!await fse.pathExists(abs)) continue
    const content = await fse.readFile(abs, 'utf-8')
    if (!content.includes(CONCURRENCY_PLACEHOLDER)) continue
    await fse.writeFile(abs, content.replaceAll(CONCURRENCY_PLACEHOLDER, maxAgents), 'utf-8')
    patched++
  }

  if (patched > 0) {
    success(`Concurrency limit set to ${maxAgents} agents in ${patched} file(s)`)
  }
}

export async function patchAgentsMd(ctx) {
  const agentsMdPath = path.join(process.cwd(), 'AGENTS.md')
  if (!await fse.pathExists(agentsMdPath)) return

  let content = await fse.readFile(agentsMdPath, 'utf-8')
  const patches = []

  if (ctx.hasOpenspec) {
    content = removeStepBlock(content, STEP1_HEADING)
    content = removeConfirmLine(content, STEP1_CONFIRM_LINE)
    patches.push('Step 1 (openspec history) removed, openspec/ already exists')
  }

  if (ctx.hasDesign) {
    content = removeStepBlock(content, STEP2_HEADING)
    content = removeConfirmLine(content, STEP2_CONFIRM_LINE)
    patches.push('Step 2 (DESIGN.md) removed, DESIGN.md already exists')
  }

  if (ctx.hasArchitecture) {
    content = removeStepBlock(content, STEP3_HEADING)
    content = removeConfirmLine(content, STEP3_CONFIRM_LINE)
    patches.push('Step 3 (ARCHITECTURE.md) removed, ARCHITECTURE.md already exists')
  }

  if (patches.length > 0) {
    content = renumberSteps(content)
    await fse.writeFile(agentsMdPath, content, 'utf-8')
    for (const msg of patches) info(msg)
    success('AGENTS.md patched for existing project state')
  }
}

export async function patchAgentGuidance(platform, cwd = process.cwd()) {
  const agentsMdPath = path.join(cwd, 'AGENTS.md')
  if (await fse.pathExists(agentsMdPath)) {
    let content = await fse.readFile(agentsMdPath, 'utf-8')
    content = replaceBetween(content, PLATFORM_WORKFLOW_START, PLATFORM_WORKFLOW_END, platformContent(platform, 'workflow'))
    content = replaceBetween(content, PLATFORM_PIPELINE_START, PLATFORM_PIPELINE_END, platformContent(platform, 'pipeline'))
    content = replaceBetween(content, PLATFORM_SKILLS_GUIDE_START, PLATFORM_SKILLS_GUIDE_END, platformContent(platform, 'skillsGuide'))
    await fse.writeFile(agentsMdPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
    success(`AGENTS.md patched for platform workflow: ${platform}`)
  }
}



import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const agentsContent = await fse.readJson(path.resolve(__dirname, '../../presets/agents-content.json'))

// Steps are matched by their title text, not by exact heading string:
// heading level (###/####) and step numbers have drifted before and silently
// broke removal. Matching `^#{3,4} Step N, <title>` survives both.
const HISTORY_STEP_TITLE = 'Archive project history'
const CHAIN_STEP_TITLE = 'Chain make commands'

const CHAIN_CONFIRM_LINE = '- ARCHITECTURE.md generated'

function stepHeadingPattern(title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^#{2,4} Step \\d+, ${escaped}`)
}

// The step heading is kept and its body replaced with an explicit skip note.
// Removing the block and renumbering the remaining steps (the old approach)
// went stale against prose cross-references like "Skip steps 2, 3, and 4";
// stable numbering plus a visible reason is unambiguous for the agent.
export function skipStepBlock(content, title, note) {
  const lines = content.split('\n')
  const pattern = stepHeadingPattern(title)
  const start = lines.findIndex(l => pattern.test(l.trim()))
  if (start === -1) return { content, matched: false }

  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break }
  }

  lines.splice(start + 1, end - start - 1, '', `> ${note}`, '')
  return { content: lines.join('\n'), matched: true }
}

function removeConfirmLine(content, line) {
  return content.split('\n').filter(l => l.trim() !== line.trim()).join('\n')
}

const PLATFORM_WORKFLOW_START = '<!-- OB-PLATFORM-WORKFLOW-START -->'
const PLATFORM_WORKFLOW_END = '<!-- OB-PLATFORM-WORKFLOW-END -->'
const PLATFORM_SKILLS_GUIDE_START = '<!-- OB-PLATFORM-SKILLS-GUIDE-START -->'
const PLATFORM_SKILLS_GUIDE_END = '<!-- OB-PLATFORM-SKILLS-GUIDE-END -->'

function platformContent(platform, key) {
  const p = agentsContent.platform[platform] ?? agentsContent.platform.github
  return p[key] ?? ''
}

function mixedPlatformContent(backlogPlatform, repoPlatform, key) {
  if (backlogPlatform === repoPlatform) {
    return platformContent(backlogPlatform, key)
  }
  const backlog = agentsContent.platform[backlogPlatform] ?? agentsContent.platform.github
  const repo = agentsContent.platform[repoPlatform] ?? agentsContent.platform.github
  const mixed = agentsContent.platform.mixed ?? {}
  const mixedKey = `${backlogPlatform}-${repoPlatform}`
  return mixed[mixedKey]?.[key] ?? mixed.default?.[key]?.replace('{backlog}', backlog[key] ?? '').replace('{repo}', repo[key] ?? '') ?? platformContent(repoPlatform, key)
}

function replaceBetween(content, start, end, replacement) {
  if (!content.includes(start) || !content.includes(end)) return content
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  return content.replace(pattern, `${start}\n${replacement.trim()}\n${end}`)
}

export async function patchAgentsMd(ctx) {
  const obInitPath = path.join(process.cwd(), '.opencode', 'commands', 'repo-initialize.md')
  if (!await fse.pathExists(obInitPath)) return

  let content = await fse.readFile(obInitPath, 'utf-8')
  const patches = []

  const skips = [
    [ctx.hasOpenspec, HISTORY_STEP_TITLE, null,
      'Skipped during onboarding: this project already had an openspec/ history. Do not archive again; continue with the next step.'],
    [ctx.hasDesign || ctx.hasArchitecture, CHAIN_STEP_TITLE, CHAIN_CONFIRM_LINE,
      'Skipped during onboarding: project files already exist. Run /make-architecture or /make-design individually to regenerate.'],
  ]

  for (const [enabled, title, confirmLine, note] of skips) {
    if (!enabled) continue
    const result = skipStepBlock(content, title, note)
    if (!result.matched) {
      warn(`repo-initialize.md step "${title}" not found — template drift? Skipping this patch.`)
      continue
    }
    content = result.content
    if (confirmLine) content = removeConfirmLine(content, confirmLine)
    patches.push(`Step "${title}" marked as skipped, file already exists`)
  }

  if (patches.length > 0) {
    await fse.writeFile(obInitPath, content, 'utf-8')
    for (const msg of patches) info(msg)
    success('repo-initialize.md patched for existing project state')
  }
}

export async function patchAgentGuidance(backlogPlatform, repoPlatform, cwd = process.cwd()) {
  const agentsMdPath = path.join(cwd, 'AGENTS.md')
  if (await fse.pathExists(agentsMdPath)) {
    const repo = repoPlatform ?? backlogPlatform ?? 'github'
    let content = await fse.readFile(agentsMdPath, 'utf-8')
    content = replaceBetween(content, PLATFORM_WORKFLOW_START, PLATFORM_WORKFLOW_END, mixedPlatformContent(backlogPlatform, repo, 'workflow'))
    content = replaceBetween(content, PLATFORM_SKILLS_GUIDE_START, PLATFORM_SKILLS_GUIDE_END, mixedPlatformContent(backlogPlatform, repo, 'skillsGuide'))
    await fse.writeFile(agentsMdPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
    const label = backlogPlatform === repo ? repo : `${backlogPlatform}→${repo}`
    success(`AGENTS.md patched for platform workflow: ${label}`)
  }
}



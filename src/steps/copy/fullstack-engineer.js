import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

const FULLSTACK_FILE = 'fullstack-engineer.md'
const FULLSTACK_DESCRIPTION = 'Default engineer that accumulates skills from all created persona engineers. Use as fallback when no specialist matches: but prefer spawning a specific engineer for deterministic results.'
const FULLSTACK_IDENTITY = 'You are the default engineer, mostly used by the user for architecture and planning. You are more complete but less accurate than specialized engineers, prefer spawning a specialist when one matches the task domain.'

export async function generateFullstackEngineer({ cwd = process.cwd() } = {}) {
  const agentsDir = path.join(cwd, '.opencode', 'agents')
  await fse.ensureDir(agentsDir)
  const filePath = path.join(agentsDir, FULLSTACK_FILE)

  let existingModel = null
  let existingAbilities = null
  let existingIdentity = null
  if (await fse.pathExists(filePath)) {
    const content = await fse.readFile(filePath, 'utf-8')
    const modelMatch = content.match(/^model:\s*(.+)$/m)
    if (modelMatch) existingModel = modelMatch[1].trim()
    const abilitiesMatch = content.match(/## Abilities\n([\s\S]*?)$/)
    if (abilitiesMatch) existingAbilities = abilitiesMatch[1].trim()
    const identityMatch = content.match(/^---\n[\s\S]*?\n---\n\n(.*?)(?:\n\n## Abilities)/s)
    if (identityMatch) existingIdentity = identityMatch[1].trim()
  }

  const frontmatter = [
    '---',
    `description: ${FULLSTACK_DESCRIPTION}`,
    'mode: primary',
    'color: success',
    'permission:',
    '  edit: allow',
    '  bash: allow',
    '  read: allow',
    '  glob: allow',
    '  grep: allow',
  ]
  if (existingModel) frontmatter.push(`model: ${existingModel}`)
  frontmatter.push('---')

  const identity = existingIdentity ?? FULLSTACK_IDENTITY

  const abilities = existingAbilities ?? [
    '- Guardrails: @ob-guardrails-generic, @ob-guardrails-project, @ob-default',
    '- Development: @ob-default',
    '- Testing: @ob-default',
    '- Infrastructure: @ob-default',
  ].join('\n')

  const content = `${frontmatter.join('\n')}\n\n${identity}\n\n## Abilities\n${abilities}\n`

  await fse.writeFile(filePath, content, 'utf-8')
  success(`Generated ${FULLSTACK_FILE}`)
  return { generated: true }
}

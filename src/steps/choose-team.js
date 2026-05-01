import { checkbox, input } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { header, success, info } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.resolve(__dirname, '../../content/.opencode/agents/.bootstrap/CUSTOM-AGENT.template.md')
const AGENTS_PRESET_PATH = path.resolve(__dirname, '../presets/agents.json')

const agentsPreset = await fse.readJson(AGENTS_PRESET_PATH)
const PRESET_AGENTS = agentsPreset.map(a => ({ name: a.label, value: a.value }))

export async function chooseTeam() {
  header('Step 5 — Choose your agent team')

  info('Select the specialist agents your project needs.')
  info('Empty agent files will be created from the template — fill them in with your stack details.')
  console.log()

  const selected = await checkbox({
    message: 'Select agents:',
    choices: PRESET_AGENTS,
  })

  // Allow custom agent names
  const addCustom = true
  const customAgents = []
  let adding = true
  while (adding) {
    const custom = await input({
      message: 'Add a custom agent name (or leave empty to skip):',
    })
    if (!custom.trim()) {
      adding = false
    } else {
      customAgents.push(custom.trim().toLowerCase().replace(/\s+/g, '-'))
    }
  }

  const allAgents = [...selected, ...customAgents]

  if (allAgents.length === 0) {
    info('No agents selected — skipping team setup.')
    return []
  }

  // Read template once
  const template = await fse.readFile(TEMPLATE_PATH, 'utf-8')
  const agentsDir = path.join(process.cwd(), '.opencode', 'agents')
  await fse.ensureDir(agentsDir)

  for (const name of allAgents) {
    const destPath = path.join(agentsDir, `${name}.md`)
    if (await fse.pathExists(destPath)) {
      info(`${name}.md already exists — skipping`)
      continue
    }
    const content = template
      .replace(/{{name}}/g, name)
      .replace(/# Backend Agent/, `# ${name.charAt(0).toUpperCase() + name.slice(1)} Agent`)
    await fse.writeFile(destPath, content, 'utf-8')
    success(`Created .opencode/agents/${name}.md`)
  }

  return allAgents
}

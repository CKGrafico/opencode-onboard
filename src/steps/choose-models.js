import { search } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { header, info, success, warn } from '../utils/exec.js'
import { fetchModels } from '../utils/models-cache.js'

const COST_TIER = (input) => {
  if (input === undefined || input === null) return ''
  if (input < 1) return ' [$]'
  if (input <= 10) return ' [$$]'
  return ' [$$$]'
}

// Use canonical cost for the tier badge so all providers of the same model
// show the same tier (e.g. github-copilot $0 subscription shows [$$] not [$])
const COST_TIER_DISPLAY = (cost, canonicalCost) =>
  COST_TIER(canonicalCost !== undefined ? canonicalCost : cost)

function formatPrice(price) {
  if (price === undefined || price === null) return '?'
  if (price === 0) return '$0 (subscription)'
  return `$${price}/M`
}

function buildDisplayModels(rawModels) {
  return rawModels.map(m => {
    const priceStr = formatPrice(m.cost)
    const canonicalNote = m.canonicalCost !== undefined
      ? ` · official price: ${formatPrice(m.canonicalCost)}/M`
      : ''
    return {
      ...m,
      label: `${m.name}${COST_TIER_DISPLAY(m.cost, m.canonicalCost)}, ${m.id}`,
      description: `${priceStr}${canonicalNote} · context: ${m.context ? (m.context / 1000) + 'k' : '?'}`,
    }
  })
}

async function pickModel(message, models) {
  return await search({
    message,
    source: (input) => {
      const q = (input || '').toLowerCase()
      const filtered = q
        ? models.filter(m =>
            m.label.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
          )
        : models
      return filtered.slice(0, 50).map(m => ({
        name: m.label,
        value: m.id,
        description: m.description,
      }))
    },
  })
}

async function writeModelToAgent(agentFile, modelId) {
  const content = await fse.readFile(agentFile, 'utf-8')
  const updated = content.replace(
    /^(---\n[\s\S]*?)\n---/m,
    `$1\nmodel: ${modelId}\n---`
  )
  await fse.writeFile(agentFile, updated, 'utf-8')
}

export async function chooseModels() {
  header('Step 8, Choose models')

  info('Fetching available models from models.dev...')
  const { models: rawModels, source } = await fetchModels()

  if (!rawModels) {
    warn('Could not fetch models (offline and no cache). Skipping model selection.')
    warn('Set models later in .agents/agents/<name>.md and .opencode/opencode.json')
    return
  }

  if (source === 'stale-cache') {
    warn('Network unavailable, using cached model list (may be outdated).')
  } else if (source === 'cache') {
    info('Using cached model list (refreshes weekly).')
  }

  const models = buildDisplayModels(rawModels)
  success(`${models.length} models available`)
  console.log()
  info('Cost indicators: [$] cheap  [$$] mid  [$$$] expensive')
  info('Type to search. Change selections later in .agents/agents/ and .opencode/opencode.json')
  console.log()

  // Plan model
  info('PLAN model, used by the main agent for proposals, specs, architecture decisions.')
  info('Pick something capable with strong reasoning.')
  const planModel = await pickModel('Plan model:', models)
  console.log()

  // Build model
  info('BUILD model, used by front-engineer, back-engineer, infra-engineer, quality-engineer, security-auditor.')
  info('Pick something capable for implementation work.')
  const buildModel = await pickModel('Build model:', models)
  console.log()

  // Fast model
  info('FAST model, used by devops-manager for reading issues, classifying PR comments.')
  info('Pick something fast and cheap, no heavy reasoning needed.')
  const fastModel = await pickModel('Fast model:', models)
  console.log()

  // Write build model to builder agents
  const buildAgents = ['front-engineer', 'back-engineer', 'infra-engineer', 'quality-engineer', 'security-auditor']
  const agentsDir = path.join(process.cwd(), '.agents', 'agents')
  for (const name of buildAgents) {
    const file = path.join(agentsDir, `${name}.md`)
    if (await fse.pathExists(file)) {
      await writeModelToAgent(file, buildModel)
      success(`${name} → ${buildModel}`)
    }
  }

  // Write fast model to devops-manager
  const devopsFile = path.join(agentsDir, 'devops-manager.md')
  if (await fse.pathExists(devopsFile)) {
    await writeModelToAgent(devopsFile, fastModel)
    success(`devops-manager → ${fastModel}`)
  }

  // Write plan model to opencode.json
  const opencodeJsonPath = path.join(process.cwd(), '.opencode', 'opencode.json')
  if (await fse.pathExists(opencodeJsonPath)) {
    const config = await fse.readJson(opencodeJsonPath)
    config.model = planModel
    await fse.writeJson(opencodeJsonPath, config, { spaces: 2 })
    success(`plan model → ${planModel} (written to .opencode/opencode.json)`)
  }

  console.log()
  warn('Make sure you have API access to the selected models.')
  warn('Change them anytime in .agents/agents/<name>.md and .opencode/opencode.json')
}

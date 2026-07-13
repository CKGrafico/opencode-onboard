import chalk from 'chalk'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { readOnboardConfig } from './shared.js'
import { copyContentStep } from '../steps/copy/index.js'
import { stampAgentModels } from '../steps/copy/agent-models.js'
import { initOpenspec } from '../steps/openspec/index.js'
import { configureAgentsMd, patchCommandFiles } from '../steps/optimization/global.js'
import { writeOnboardConfig } from '../steps/metadata/index.js'
import { exit } from '../utils/process.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const platformsPreset = await fse.readJson(path.resolve(__dirname, '../presets/platforms.json'))
const VALID_PLATFORMS = new Set(platformsPreset.map(p => p.value))

function resolvePlatform(value, fallback = 'github') {
  return VALID_PLATFORMS.has(value) ? value : fallback
}

export async function runUpdate() {
  const saved = await readOnboardConfig()
  if (!saved?.wizard) {
    console.log(chalk.red('No opencode-onboard config found. Run the wizard first.'))
    exit(1)
    return
  }

  const w = saved.wizard
  const backlogPlatform = resolvePlatform(w.backlogPlatform ?? w.platform)
  const repoPlatform = resolvePlatform(w.repoPlatform ?? w.platform)

  const ctx = {
    hasDesign: !!w.preserved?.design,
    hasArchitecture: !!w.preserved?.architecture,
    hasOpenspec: !!w.preserved?.openspec,
    sourceMode: w.sourceMode ?? 'current',
    sourceRoots: Array.isArray(w.sourceRoots) ? w.sourceRoots : [],
    maxConcurrentAgents: w.maxConcurrentAgents ?? 3,
    installScope: w.installScope ?? 'local',
    skipSkills: true,
    forceOverwrite: true,
  }

  console.log()
  console.log(chalk.bold('Updating project from saved config'))
  console.log(chalk.dim(`  backlog: ${backlogPlatform}  repo: ${repoPlatform}  agents: ${ctx.maxConcurrentAgents}`))
  console.log()

  await copyContentStep({ backlogPlatform, repoPlatform }, ctx)

  if (w.openspec?.initialized) {
    await initOpenspec()
  }

  if (w.models) {
    await stampAgentModels({ models: w.models })
  }

  const optionalTools = w.optionalTools ?? {}
  const tokenOpt = {
    rtk: { optedIn: !!optionalTools.rtk?.optedIn },
    caveman: { optedIn: !!optionalTools.caveman?.optedIn },
    codegraph: { optedIn: !!optionalTools.codegraph?.optedIn },
    memory: { optedIn: !!optionalTools.memory?.optedIn },
  }
  await configureAgentsMd(tokenOpt)
  await patchCommandFiles(tokenOpt)

  await writeOnboardConfig({
    ...ctx,
    backlogPlatform,
    repoPlatform,
    maxConcurrentAgents: ctx.maxConcurrentAgents,
    installScope: ctx.installScope,
    additionalSkillsProvider: w.additionalSkillsProvider ?? 'npx-skills',
    planModel: w.models?.plan ?? null,
    buildModel: w.models?.build ?? null,
    fastModel: w.models?.fast ?? null,
    optionalTools,
    cavemanGuidance: w.cavemanGuidance ?? null,
  })

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Update complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
}

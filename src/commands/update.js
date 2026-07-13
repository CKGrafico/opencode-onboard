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
  if (!saved?.platform) {
    console.log(chalk.red('No opencode-onboard config found. Run the wizard first.'))
    exit(1)
    return
  }

  const backlogPlatform = resolvePlatform(saved.platform.backlog)
  const repoPlatform = resolvePlatform(saved.platform.repo)

  const ctx = {
    hasDesign: !!saved.preexisting?.design,
    hasArchitecture: !!saved.preexisting?.architecture,
    hasOpenspec: !!saved.preexisting?.openspec,
    sourceMode: saved.source?.mode ?? 'current',
    sourceRoots: Array.isArray(saved.source?.roots) ? saved.source.roots : [],
    maxConcurrentAgents: saved.agents?.maxConcurrent ?? 3,
    skipSkills: true,
    forceOverwrite: true,
  }

  console.log()
  console.log(chalk.bold('Updating project from saved config'))
  console.log(chalk.dim(`  backlog: ${backlogPlatform}  repo: ${repoPlatform}  agents: ${ctx.maxConcurrentAgents}`))
  console.log()

  await copyContentStep({ backlogPlatform, repoPlatform }, ctx)

  if (saved.preexisting?.openspec) {
    await initOpenspec()
  }

  if (saved.models) {
    await stampAgentModels({ models: saved.models })
  }

  const tools = saved.tools ?? {}
  const tokenOpt = {
    rtk: { optedIn: !!tools.rtk },
    caveman: { optedIn: !!tools.caveman },
    codegraph: { optedIn: !!tools.codegraph },
    memory: { optedIn: !!tools.memory },
  }
  await configureAgentsMd(tokenOpt)
  await patchCommandFiles(tokenOpt)

  await writeOnboardConfig({
    ...ctx,
    backlogPlatform,
    repoPlatform,
    maxConcurrentAgents: ctx.maxConcurrentAgents,
    planModel: saved.models?.plan ?? null,
    buildModel: saved.models?.build ?? null,
    fastModel: saved.models?.fast ?? null,
    optionalTools: tools,
  })

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Update complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
}

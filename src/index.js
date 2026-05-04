#!/usr/bin/env node
import chalk from 'chalk'
import { createRequire } from 'node:module'
import path from 'node:path'
import fse from 'fs-extra'
import { checkEnv } from './steps/check-env.js'
import { checkPlatform } from './steps/check-platform.js'
import { checkRtk } from './steps/check-rtk.js'
import { chooseModels } from './steps/choose-models.js'
import { choosePlatform } from './steps/choose-platform.js'
import { chooseSourceScope } from './steps/choose-source-scope.js'
import { chooseSkillsProvider } from './steps/choose-skills-provider.js'
import { cleanAiFiles } from './steps/clean-ai-files.js'
import { copyContentStep } from './steps/copy-content.js'
import { initOpenspec } from './steps/init-openspec.js'
import { patchAgentsMd } from './steps/patch-agents-md.js'
import { installQuota } from './steps/install-quota.js'
import { installCaveman } from './steps/install-caveman.js'
import { enableCavemanGuidance } from './steps/enable-caveman-guidance.js'
import { installBrowser } from './steps/install-browser.js'
import { writeOnboardConfig } from './steps/write-onboard-config.js'
import { loading } from './utils/exec.js'
import { tokenOptimizationStep } from './steps/token-optimization.js'

function printHelp(version) {
  console.log(`opencode-onboard v${version}`)
  console.log()
  console.log('Usage:')
  console.log('  npx opencode-onboard                Run full onboarding wizard')
  console.log('  npx opencode-onboard <command>      Run a single step command')
  console.log()
  console.log('Commands:')
  console.log('  clean           Run AI files cleanup step')
  console.log('  platform        Run platform selection step')
  console.log('  copy            Run content copy step')
  console.log('  openspec        Run OpenSpec initialization step')
  console.log('  skills          Run skills install step')
  console.log('  models          Run models selection step')
  console.log('  optimization    Run token optimization tools step')
  console.log('  quota           Run opencode-quota installer step')
  console.log('  rtk             Run rtk check step')
  console.log('  caveman         Run caveman install + guidance steps')
  console.log('  browser         Run opencode-browser installer step')
  console.log('  metadata        Write onboarding metadata step')
  console.log()
  console.log('Options:')
  console.log('  -h, --help      Show this help message')
}

async function readOnboardConfig() {
  const cfgPath = path.join(process.cwd(), '.opencode', 'opencode-onboard.json')
  if (!await fse.pathExists(cfgPath)) return null
  try {
    return await fse.readJson(cfgPath)
  } catch {
    return null
  }
}

async function runSingleCommand(command) {
  const saved = await readOnboardConfig()
  const savedWizard = saved?.wizard ?? {}
  const ctx = {
    hasDesign: !!savedWizard?.preserved?.design,
    hasArchitecture: !!savedWizard?.preserved?.architecture,
    hasOpenspec: !!savedWizard?.preserved?.openspec,
    sourceMode: savedWizard?.sourceMode ?? 'current',
    sourceRoots: Array.isArray(savedWizard?.sourceRoots) ? savedWizard.sourceRoots : [],
  }
  const platform = savedWizard?.platform
  const resolvedPlatform = platform === 'azure' || platform === 'github' ? platform : 'github'

  if (command === 'clean') {
    await cleanAiFiles()
    return true
  }

  if (command === 'platform') {
    await choosePlatform()
    return true
  }

  if (command === 'copy') {
    await copyContentStep(resolvedPlatform, ctx)
    await patchAgentsMd(ctx)
    return true
  }

  if (command === 'openspec') {
    await initOpenspec()
    return true
  }

  if (command === 'skills') {
    await chooseSkillsProvider()
    return true
  }

  if (command === 'models') {
    await chooseModels()
    return true
  }

  if (command === 'optimization') {
    await tokenOptimizationStep({ skillsProvider: savedWizard?.additionalSkillsProvider })
    return true
  }

  if (command === 'quota') {
    await installQuota()
    return true
  }

  if (command === 'rtk') {
    await checkRtk()
    return true
  }

  if (command === 'caveman') {
    const caveman = await installCaveman({ skillsProvider: savedWizard?.additionalSkillsProvider })
    await enableCavemanGuidance(caveman)
    return true
  }

  if (command === 'browser') {
    await installBrowser()
    return true
  }

  if (command === 'metadata') {
    await writeOnboardConfig({
      ...ctx,
      platform: resolvedPlatform,
      additionalSkillsProvider: savedWizard?.additionalSkillsProvider ?? 'none',
      planModel: savedWizard?.models?.plan ?? null,
      buildModel: savedWizard?.models?.build ?? null,
      fastModel: savedWizard?.models?.fast ?? null,
      optionalTools: savedWizard?.optionalTools ?? null,
      cavemanGuidance: savedWizard?.cavemanGuidance ?? null,
    })
    return true
  }

  return false
}

if (process.stdout.isTTY) console.clear()
console.log()
const require = createRequire(import.meta.url)
const { version } = require('../package.json')
const args = process.argv.slice(2)

if (args.includes('-h') || args.includes('--help')) {
  printHelp(version)
  process.exit(0)
}

if (args.length > 0) {
  const ok = await runSingleCommand(args[0])
  if (!ok) {
    console.log(chalk.red(`Unknown command: ${args[0]}`))
    console.log()
    printHelp(version)
    process.exit(1)
  }
  process.exit(0)
}

const logo = chalk.hex('#fe3d57')
const bannerLines = [
  logo('                             '),
  logo('        ▒▒▒▒▒▒▒▒▒▒▒▒▒        '),
  logo('        ▒▒▓       ▓▒▓        '),
  logo('   ▒▒▒▒▒▒▓▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒   '),
  logo('  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓  '),
  logo(' ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓ '),
  logo(' ▓▒▒▒▒░░░▒▒▒▒▒▒▒▒▒▒▒░░░▒▒▒▓▓ '),
  logo('  ▓▓▓▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒▓▓▓▓  '),
  logo('  ▓▓▒▒▒▒▒▒░▒▒▒▒▒▒▒░▒▒▒▒▒▒▓▓  '),
  logo('  ▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓   '),
  logo('  ▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓   '),
  logo('   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    '),
  '',
  chalk.bold('        🧰 opencode-onboard') + chalk.dim(` v${version}`),
  chalk.dim('        Prepare your codebase for AI agents'),
]

for (const line of bannerLines) console.log(line)
console.log()
console.log('  This tool will set up your project with a team of AI agents,')
console.log('  install skills, select models, and configure OpenCode.')
console.log()

// Only wait for Enter in a real interactive TTY
if (process.stdin.isTTY) {
  console.log(chalk.bold('  Press Enter to begin...'))
  console.log()
  await new Promise(resolve => {
    process.stdin.resume()
    process.stdin.once('data', () => {
      process.stdin.pause()
      resolve()
    })
  })
}

try {
  // 1. Check Node + pnpm
  await checkEnv()
  loading('preparing next step...')

  // 2. Choose source code scope for init analysis
  const scope = await chooseSourceScope()
  loading('preparing next step...')

  // 3. Clean existing AI config files, detect preserved state
  const preserve = await cleanAiFiles()
  const ctx = { ...preserve, ...scope }
  loading('preparing next step...')

  // 4. Choose platform
  const platform = await choosePlatform()
  loading('preparing next step...')

  // 5. Check platform CLI (az or gh)
  await checkPlatform(platform)
  loading('preparing next step...')

  // 6. Copy content
  await copyContentStep(platform, ctx)
  loading('preparing next step...')

  // 6b. Patch AGENTS.md to skip steps for already-existing files
  await patchAgentsMd(ctx)
  loading('preparing next step...')

  // 7. Init OpenSpec
  await initOpenspec()
  loading('preparing next step...')

  // 8. Install skills
  const skillsSelection = await chooseSkillsProvider()
  loading('preparing next step...')

  // 9. Choose models
  const selectedModels = await chooseModels()
  loading('preparing next step...')

  // 10. Token optimization tools
  const tokenOpt = await tokenOptimizationStep({ skillsProvider: skillsSelection.additionalSkillsProvider })
  const { rtk, quota, caveman, cavemanGuidance } = tokenOpt
  loading('preparing next step...')

  // 11. Install opencode-browser
  await installBrowser()
  loading('preparing next step...')

  // 12. Write onboarding metadata
  await writeOnboardConfig({
    ...ctx,
    platform,
    ...skillsSelection,
    ...selectedModels,
    optionalTools: { rtk, quota, caveman },
    cavemanGuidance,
  })

  // Done
  const toGenerate = [
    !ctx.hasDesign && 'DESIGN.md',
    !ctx.hasArchitecture && 'ARCHITECTURE.md',
  ].filter(Boolean)

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Onboarding complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Open this project in OpenCode and type:')
  console.log(chalk.bold('  "init"'))
  console.log()
  if (toGenerate.length > 0) {
    console.log(`  OpenCode will generate ${toGenerate.join(' and ')}`)
    console.log('  from your actual codebase, then activate the agent team.')
  } else {
    console.log('  OpenCode will activate the agent team.')
  }
  console.log(`  Source scope: ${ctx.sourceMode === 'parent-selected' ? ctx.sourceRoots.map(p => `../${p.split(/[/\\]/).pop()}`).join(', ') : 'current folder'}`)
  console.log()
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log()
    console.log(chalk.yellow('Cancelled.'))
  } else {
    console.error(chalk.red('\nUnexpected error:'), err.message)
    process.exit(1)
  }
}

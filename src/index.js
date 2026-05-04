#!/usr/bin/env node
import chalk from 'chalk'
import { createRequire } from 'node:module'
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
import { installBrowser } from './steps/install-browser.js'

if (process.stdout.isTTY) console.clear()
console.log()
const require = createRequire(import.meta.url)
const { version } = require('../package.json')
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

  // 2. Choose source code scope for init analysis
  const scope = await chooseSourceScope()

  // 3. Clean existing AI config files, detect preserved state
  const preserve = await cleanAiFiles()
  const ctx = { ...preserve, ...scope }

  // 4. Choose platform
  const platform = await choosePlatform()

  // 5. Check platform CLI (az or gh)
  await checkPlatform(platform)

  // 6. Copy content
  await copyContentStep(platform, ctx)

  // 6b. Patch AGENTS.md to skip steps for already-existing files
  await patchAgentsMd(ctx)

  // 7. Init OpenSpec
  await initOpenspec()

  // 8. Install skills
  await chooseSkillsProvider()

  // 9. Choose models
  await chooseModels()

  // 10. Check RTK
  await checkRtk()

  // 11. Install opencode-browser
  await installBrowser()

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

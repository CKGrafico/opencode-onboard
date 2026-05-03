#!/usr/bin/env node
import chalk from 'chalk'
import { createRequire } from 'node:module'
import { checkEnv } from './steps/check-env.js'
import { checkPlatform } from './steps/check-platform.js'
import { checkRtk } from './steps/check-rtk.js'
import { chooseModels } from './steps/choose-models.js'
import { choosePlatform } from './steps/choose-platform.js'
import { chooseSkillsProvider } from './steps/choose-skills-provider.js'
import { cleanAiFiles } from './steps/clean-ai-files.js'
import { copyContentStep } from './steps/copy-content.js'
import { initOpenspec } from './steps/init-openspec.js'
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

  // 2. Clean existing AI config files
  await cleanAiFiles()

  // 3. Choose platform
  const platform = await choosePlatform()

  // 4. Check platform CLI (az or gh)
  await checkPlatform(platform)

  // 5. Copy content
  await copyContentStep(platform)

  // 6. Init OpenSpec
  await initOpenspec()

  // 7. Install skills
  await chooseSkillsProvider()

  // 8. Choose models
  await chooseModels()

  // 9. Check RTK
  await checkRtk()

  // 10. Install opencode-browser
  await installBrowser()

  // Done
  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Onboarding complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Next step:')
  console.log(chalk.hex('#fe3d57')('  Open OpenCode in this project and type: ') + chalk.bold('"init"'))
  console.log()
  console.log('  OpenCode will generate ARCHITECTURE.md and DESIGN.md')
  console.log('  from your actual codebase, then activate the agent team.')
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

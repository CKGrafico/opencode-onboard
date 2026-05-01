#!/usr/bin/env node
import chalk from 'chalk'
import { checkEnv } from './steps/check-env.js'
import { cleanAiFiles } from './steps/clean-ai-files.js'
import { choosePlatform } from './steps/choose-platform.js'
import { copyContentStep } from './steps/copy-content.js'
import { chooseTeam } from './steps/choose-team.js'
import { initOpenspec } from './steps/init-openspec.js'
import { installBrowser } from './steps/install-browser.js'
import { checkRtk } from './steps/check-rtk.js'
import { checkPlatform } from './steps/check-platform.js'

console.log()
console.log(chalk.bold('┌─────────────────────────────────────┐'))
console.log(chalk.bold('│        opencode-onboard             │'))
console.log(chalk.bold('│  Prepare your codebase for AI agents│'))
console.log(chalk.bold('└─────────────────────────────────────┘'))
console.log()

try {
  // 1. Check Node + npm/pnpm
  await checkEnv()

  // 2. Clean existing AI config files
  await cleanAiFiles()

  // 3. Choose platform
  const platform = await choosePlatform()

  // 4. Copy content filtered by platform
  await copyContentStep(platform)

  // 5. Choose team agents
  await chooseTeam()

  // 6. Init OpenSpec
  await initOpenspec()

  // 7. Install opencode-browser
  await installBrowser()

  // 8. Check rtk
  await checkRtk()

  // 9. Check platform CLI (az or gh)
  await checkPlatform(platform)

  // Done
  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Onboarding complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Next step:')
  console.log(chalk.cyan('  Open OpenCode in this project and type: ') + chalk.bold('"init"'))
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

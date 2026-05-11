import chalk from 'chalk'
import { installBrowser } from '../steps/browser/index.js'
import { checkRtk } from '../steps/optimization/index.js'
import { checkPlatform, choosePlatform } from '../steps/platform/index.js'
import { header, info } from '../utils/exec.js'
import { readOnboardConfig } from './shared.js'

export async function runJoin() {
  const logo = chalk.hex('#fe3d57')
  console.log()
  console.log(logo('  🤝 opencode-onboard join'))
  console.log(chalk.dim('  New team member setup, checks & local installs only'))
  console.log(chalk.dim('  This will NOT modify any project files.'))
  console.log()

  // Step 1: Platform CLI check
  header('Step 1, Platform CLI check')
  const saved = await readOnboardConfig()
  const savedPlatform = saved?.wizard?.platform
  if (savedPlatform) {
    info(`Detected project platform: ${savedPlatform === 'github' ? 'GitHub' : 'Azure DevOps'}`)
    await checkPlatform(savedPlatform)
  } else {
    const platform = await choosePlatform()
    void platform // result not persisted in join mode
  }

  // Step 2: rtk check
  header('Step 2, Checking rtk')
  await checkRtk({ skipHeader: true })

  // Step 3: Browser extension
  await installBrowser()

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Join setup complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Your local environment is ready.')
  console.log('  Open the project in OpenCode and start coding!')
  console.log()
}

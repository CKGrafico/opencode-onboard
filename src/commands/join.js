import chalk from 'chalk'
import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'node:path'
import { installBrowser } from '../steps/browser/index.js'
import { checkRtk } from '../steps/optimization/index.js'
import { installMemory } from '../steps/optimization/memory.js'
import { checkPlatform, choosePlatform } from '../steps/platform/index.js'
import { commandExists, header, info, success, warn } from '../utils/exec.js'
import { readOnboardConfig } from './shared.js'

export async function runJoin() {
  const logo = chalk.hex('#fe3d57')
  console.log()
  console.log(logo('  🤝 opencode-onboard join'))
  console.log(chalk.dim('  New team member setup — checks & local installs only.'))
  console.log(chalk.dim('  Does not modify committed project files.'))
  console.log()

  const saved = await readOnboardConfig()

  if (!saved) {
    warn('No .opencode/opencode-onboard.json found.')
    warn('This project may not have been onboarded yet. Run `npx opencode-onboard` first.')
    return
  }

  const savedWizard = saved?.wizard ?? {}
  const savedPlatform = savedWizard?.platform
  const installScope = savedWizard?.installScope ?? 'local'

  // Step 1: Platform CLI check
  header('Step 1, Platform CLI check')
  if (savedPlatform) {
    const display = savedPlatform === 'github' ? 'GitHub' : savedPlatform === 'azure' ? 'Azure DevOps' : 'None'
    info(`Detected project platform: ${display}`)
    await checkPlatform(savedPlatform)
  } else {
    const platform = await choosePlatform()
    void platform
  }

  // Step 2: Install OpenCode plugins
  header('Step 2, Installing OpenCode plugins')
  const opencodeDir = path.join(process.cwd(), '.opencode')
  const pkgPath = path.join(opencodeDir, 'package.json')
  if (await fse.pathExists(pkgPath)) {
    try {
      await execa('npm', ['install'], { cwd: opencodeDir, reject: false, stdio: 'pipe' })
      success('OpenCode plugins installed')
    } catch {
      warn('npm install failed in .opencode/ — plugins may not load correctly')
    }
  } else {
    warn('No .opencode/package.json found — skipping plugin install')
  }

  // Step 3: Install/update skills
  header('Step 3, Installing skills')
  try {
    await execa('npx', ['skills'], { cwd: process.cwd(), reject: false, stdio: 'pipe' })
    success('Skills installed/updated')
  } catch {
    warn('npx skills failed — skills may be missing')
  }

  // Step 4: basic-memory check (if project uses it)
  const opencodeJson = path.join(opencodeDir, 'opencode.json')
  if (await fse.pathExists(opencodeJson)) {
    try {
      const cfg = await fse.readJson(opencodeJson)
      if (cfg?.mcp?.['basic-memory']) {
        header('Step 4, Installing basic-memory')
        const uvAvailable = await commandExists('uv')
        if (uvAvailable) {
          await installMemory({ skipHeader: true })
        } else {
          warn('uv not found — basic-memory MCP will not work. Install uv from https://docs.astral.sh/uv/')
        }
      }
    } catch {
      // ignore config read errors
    }
  }

  // Step 5: RTK check
  header('Step 5, Checking rtk')
  await checkRtk({ skipHeader: true, skipPrompt: true })

  // Step 6: Browser extension
  header('Step 6, Installing opencode-browser')
  await installBrowser({ installScope })

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Join setup complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Your local environment is ready.')
  console.log('  Open the project in OpenCode and start coding!')
  console.log()
}

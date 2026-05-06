import { select } from '@inquirer/prompts'
import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { code, commandExists, header, info, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLATFORMS_PRESET_PATH = path.resolve(__dirname, '../../presets/platforms.json')
const platformsPreset = await fse.readJson(PLATFORMS_PRESET_PATH)


export async function checkPlatform(platform) {
  const preset = platformsPreset.find(p => p.value === platform) || platformsPreset[0]
  await checkPlatformCli(preset)
}

export async function choosePlatform() {
  header('Step 3, Version control platform')

  const platform = await select({
    message: 'Which platform are you using?',
    choices: platformsPreset.map(p => ({ name: p.name, value: p.value })),
  })

  success(`Platform: ${platform === 'github' ? 'GitHub' : 'Azure DevOps'}`)
  await checkPlatform(platform)
  return platform
}

async function checkPlatformCli(platformPreset) {
  const { cli } = platformPreset
  header(`Step 4, Checking ${platformPreset.name} CLI`)

  const hasCli = await commandExists(cli.command)
  if (!hasCli) {
    warn(`${cli.displayName} not found.`)
    info(`Install from: ${cli.installUrl}`)
    if (cli.authCheck?.commands?.length) {
      console.log()
      info('After installing, authenticate with:')
      code(cli.authCheck.commands)
    }
    return
  }
  success(`${cli.displayName} available`)

  if (cli.authCheck) await runAuthCheck(cli)
  if (cli.extensionCheck) await runExtensionCheck(cli)
}

async function runAuthCheck(cli) {
  try {
    const result = await execa(cli.command, cli.authCheck.args, { reject: false })
    if (result.exitCode === 0) {
      success(`${cli.displayName} authenticated`)
    } else {
      warn(cli.authCheck.notAuthenticatedMessage)
      code(cli.authCheck.commands)
    }
  } catch {
    warn(`Could not check ${cli.command} auth status.`)
  }
}

async function runExtensionCheck(cli) {
  try {
    const result = await execa(cli.command, cli.extensionCheck.args, { reject: false })
    const hasExtension = result.stdout && result.stdout.includes(cli.extensionCheck.expectedOutput)

    if (hasExtension) {
      success(`${cli.extensionCheck.expectedOutput} extension installed`)
    } else {
      warn(cli.extensionCheck.missingMessage)
      code(cli.extensionCheck.commands)
    }
  } catch {
    warn(cli.extensionCheck.errorMessage)
    code(cli.extensionCheck.commands)
  }
}

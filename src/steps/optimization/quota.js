import { confirm } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { error, header, info, loading, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const QUOTA_PRESET_PATH = path.resolve(__dirname, '../../presets/quota.json')
const quotaPreset = await fse.readJson(QUOTA_PRESET_PATH)
const PLUGIN = quotaPreset.plugin

function ensurePlugin(config) {
  if (!Array.isArray(config.plugin)) config.plugin = []
  if (!config.plugin.includes(PLUGIN)) config.plugin.push(PLUGIN)
}

function addIfMissing(target, key, value) {
  if (!(key in target)) target[key] = value
}

export async function installQuota(options = {}) {
  if (!options.skipHeader) header('Installing opencode-quota')

  let shouldInstall = true
  if (!options.skipPrompt && process.stdin.isTTY) {
    const timeoutMs = quotaPreset.prompt.timeoutMs
    const choice = await Promise.race([
      confirm({
        message: quotaPreset.prompt.message,
        default: quotaPreset.prompt.default,
      }),
      new Promise(resolve => setTimeout(() => resolve(true), timeoutMs)),
    ])
    shouldInstall = choice !== false
  }

  if (!shouldInstall) {
    warn('Skipped opencode-quota installation')
    return { optedIn: false, installed: false }
  }

  loading('configuring opencode-quota...')

  try {
    const opencodeDir = path.join(process.cwd(), '.opencode')
    const opencodePath = path.join(opencodeDir, 'opencode.json')
    const tuiPath = path.join(opencodeDir, 'tui.json')
    const quotaDir = path.join(opencodeDir, 'opencode-quota')
    const quotaPath = path.join(quotaDir, 'quota-toast.json')

    const opencode = await fse.pathExists(opencodePath)
      ? await fse.readJson(opencodePath)
      : { $schema: 'https://opencode.ai/config.json' }

    const tui = await fse.pathExists(tuiPath)
      ? await fse.readJson(tuiPath)
      : { $schema: 'https://opencode.ai/tui.json' }

    ensurePlugin(opencode)
    ensurePlugin(tui)

    await fse.ensureDir(opencodeDir)
    await fse.writeJson(opencodePath, opencode, { spaces: 2 })
    await fse.writeJson(tuiPath, tui, { spaces: 2 })

    const quotaConfig = await fse.pathExists(quotaPath)
      ? await fse.readJson(quotaPath)
      : {}

    for (const [key, value] of Object.entries(quotaPreset.defaults)) {
      addIfMissing(quotaConfig, key, value)
    }

    await fse.ensureDir(quotaDir)
    await fse.writeJson(quotaPath, quotaConfig, { spaces: 2 })

    success('opencode-quota configured (manual setup)')
    info('Restart OpenCode and run /quota to verify')
    return { optedIn: true, installed: true }
  } catch (err) {
    error(`Failed to configure opencode-quota: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

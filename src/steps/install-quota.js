import { confirm } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'node:path'
import { header, success, warn, error, loading, info } from '../utils/exec.js'

const PLUGIN = '@slkiser/opencode-quota'

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
    const timeoutMs = 20000
    const choice = await Promise.race([
      confirm({
        message: 'Install opencode-quota with recommended defaults?',
        default: true,
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

    // Keep installer semantics append-only: add defaults only when missing.
    addIfMissing(quotaConfig, 'enabledProviders', 'auto')
    addIfMissing(quotaConfig, 'formatStyle', 'singleWindow')
    addIfMissing(quotaConfig, 'percentDisplayMode', 'used')
    addIfMissing(quotaConfig, 'showSessionTokens', true)

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

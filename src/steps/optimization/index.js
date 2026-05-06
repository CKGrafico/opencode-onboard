import { checkbox, confirm } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { code, commandExists, header, info, loading, success, warn } from '../../utils/exec.js'
import { installQuota } from './quota.js'
import { installCaveman } from './caveman.js'
import { enableCavemanGuidance } from './caveman-guidance.js'
import { configureObGlobal } from './global.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OPTIMIZATION_PRESET_PATH = path.resolve(__dirname, '../../presets/optimization.json')
const optimizationPreset = await fse.readJson(OPTIMIZATION_PRESET_PATH)

export async function checkRtk(options = {}) {
  if (!options.skipHeader) header('Checking rtk')

  let shouldCheck = true
  if (!options.skipPrompt) {
    info('Recommended: install and verify rtk for safer agent CLI command execution.')
    shouldCheck = await confirm({
      message: 'Check rtk now?',
      default: true,
    })
  }

  if (!shouldCheck) {
    warn('Skipped rtk check (you can install it later)')
    return { optedIn: false, checked: false, available: false }
  }

  loading('checking rtk...')

  const available = await commandExists('rtk')

  if (available) {
    success('rtk is available')
    return { optedIn: true, checked: true, available: true }
  }

  warn('rtk not found on PATH.')
  console.log()
  info('rtk is required for agents to run CLI commands safely.')
  info('Install it from: https://github.com/rtk-ai/rtk#pre-built-binaries')
  console.log()
  info('After installing, verify with:')
  code(['rtk --version'])
  return { optedIn: true, checked: true, available: false }
}

export async function tokenOptimizationStep(options = {}) {
  header('Step 8, Token optimization tools')

  const defaultSelected = optimizationPreset.choices
    .filter(choice => choice.checked)
    .map(choice => choice.value)
  let selected = defaultSelected

  if (!options.skipPrompt && process.stdin.isTTY) {
    info(optimizationPreset.info)
    const timeoutMs = optimizationPreset.timeoutMs
    const choice = await Promise.race([
      checkbox({
        message: optimizationPreset.message,
        choices: optimizationPreset.choices,
      }),
      new Promise(resolve => setTimeout(() => resolve(defaultSelected), timeoutMs)),
    ])
    selected = Array.isArray(choice) ? choice : defaultSelected
  }

  loading('applying token optimization selections...')

  const has = value => selected.includes(value)

  const rtk = has('rtk')
    ? await checkRtk({ skipHeader: true, skipPrompt: true })
    : { optedIn: false, checked: false, available: false }

  const quota = has('quota')
    ? await installQuota({ skipHeader: true, skipPrompt: true })
    : { optedIn: false, installed: false }

  const caveman = has('caveman')
    ? await installCaveman({
      skipHeader: true,
      skipPrompt: true,
    })
    : { optedIn: false, installed: false }

  const cavemanGuidance = has('caveman')
    ? await enableCavemanGuidance(caveman)
    : { enabled: false }

  const obGlobal = await configureObGlobal(options.ctx || {}, { rtk, quota, caveman, cavemanGuidance })

  if (selected.length === 0) warn('No token optimization tools selected')
  else success('Token optimization step completed')

  return { rtk, quota, caveman, cavemanGuidance, obGlobal }
}

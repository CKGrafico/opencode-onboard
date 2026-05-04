import { confirm } from '@inquirer/prompts'
import { code, commandExists, header, info, loading, success, warn } from '../utils/exec.js'

export async function checkRtk() {
  header('Step 10, Checking rtk')

  info('Recommended: install and verify rtk for safer agent CLI command execution.')
  const shouldCheck = await confirm({
    message: 'Check rtk now?',
    default: true,
  })

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

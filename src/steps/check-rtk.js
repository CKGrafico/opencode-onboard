import { code, commandExists, header, info, success, warn } from '../utils/exec.js'

export async function checkRtk() {
  header('Step 10, Checking rtk')

  const available = await commandExists('rtk')

  if (available) {
    success('rtk is available')
    return
  }

  warn('rtk not found on PATH.')
  console.log()
  info('rtk is required for agents to run CLI commands safely.')
  info('Install it from: https://github.com/rtk-ai/rtk#pre-built-binaries')
  console.log()
  info('After installing, verify with:')
  code(['rtk --version'])
}

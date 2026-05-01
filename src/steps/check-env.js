import { commandExists, header, success, error } from '../utils/exec.js'
import { execa } from 'execa'

export async function checkEnv() {
  header('Step 1 — Checking environment')

  // Node version
  const nodeVersion = process.version
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10)
  if (major < 18) {
    error(`Node.js ${nodeVersion} detected. Version 18+ is required.`)
    process.exit(1)
  }
  success(`Node.js ${nodeVersion}`)

  // npm or pnpm
  const hasPnpm = await commandExists('pnpm')
  const hasNpm = await commandExists('npm')

  if (!hasPnpm && !hasNpm) {
    error('Neither npm nor pnpm found. Please install Node.js from https://nodejs.org')
    process.exit(1)
  }

  if (hasPnpm) success('pnpm available')
  else success('npm available')
}

import { header, success, warn, info, error } from '../utils/exec.js'
import { execa } from 'execa'

export async function initOpenspec() {
  header('Step 6 — Initializing OpenSpec')

  try {
    const result = await execa('npx', ['@fission-ai/openspec', 'init'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      reject: false,
    })

    if (result.exitCode === 0) {
      success('OpenSpec initialized')
    } else {
      warn('OpenSpec init exited with non-zero code — check output above')
    }
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`)
  }
}

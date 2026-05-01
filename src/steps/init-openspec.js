import { execa } from 'execa'
import { error, header, success, warn } from '../utils/exec.js'

export async function initOpenspec() {
  header('Step 6, Initializing OpenSpec')

  try {
    const result = await execa('npx', ['@fission-ai/openspec', 'init', '--tools', 'opencode', '--force'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      reject: false,
    })

    if (result.exitCode === 0) {
      success('OpenSpec initialized')
    } else {
      warn('OpenSpec init exited with non-zero code, check output above')
    }
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`)
  }
}

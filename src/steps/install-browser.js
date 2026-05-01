import { header, success, warn, error, info } from '../utils/exec.js'
import { execa } from 'execa'

export async function installBrowser() {
  header('Step 7 — Installing opencode-browser')

  info('Running: npx @different-ai/opencode-browser install')
  console.log()

  try {
    const result = await execa('npx', ['@different-ai/opencode-browser', 'install'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      reject: false,
    })

    if (result.exitCode === 0) {
      success('opencode-browser installed')
    } else {
      warn('opencode-browser install exited with non-zero code — check output above')
    }
  } catch (err) {
    error(`Failed to install opencode-browser: ${err.message}`)
  }
}

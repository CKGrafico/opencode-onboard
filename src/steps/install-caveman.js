import { confirm } from '@inquirer/prompts'
import { execa } from 'execa'
import { header, success, warn, error, loading } from '../utils/exec.js'

export async function installCaveman() {
  header('Step 12, Installing caveman')

  const shouldInstall = await confirm({
    message: 'Install caveman for OpenCode?',
    default: true,
  })

  if (!shouldInstall) {
    warn('Skipped caveman installation')
    return { optedIn: false, installed: false }
  }

  loading('installing caveman...')

  try {
    const result = await execa('npx', ['skills', 'add', 'JuliusBrussee/caveman', '-a', 'opencode'], {
      reject: false,
    })

    if (result.exitCode === 0) {
      success('caveman installed')
      return { optedIn: true, installed: true }
    } else {
      warn('caveman install exited with non-zero code')
      return { optedIn: true, installed: false }
    }
  } catch (err) {
    error(`Failed to install caveman: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

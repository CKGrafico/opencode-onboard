import { execa } from 'execa'
import { header, success, warn, error, loading, info } from '../../utils/exec.js'

export async function installCaveman(options = {}) {
  if (!options.skipHeader) header('Installing caveman')

  loading('installing caveman...')

  try {
    info('Installing caveman via npx skills')
    const result = await execa('npx', ['skills', 'add', 'JuliusBrussee/caveman/caveman', '-a', 'opencode', '--yes'], {
      reject: false,
      timeout: 600000,
      stdio: 'pipe',
    })

    if (result.exitCode === 0) {
      success('caveman installed')
      return { optedIn: true, installed: true }
    }

    if (result.stderr?.trim()) warn(result.stderr.trim().split('\n').slice(-3).join('\n'))
    warn('caveman install exited with non-zero code')
    return { optedIn: true, installed: false }
  } catch (err) {
    error(`Failed to install caveman: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

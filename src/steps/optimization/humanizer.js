import { execa } from 'execa'
import { header, success, warn, error, loading, info } from '../../utils/exec.js'

export async function installHumanizer(options = {}) {
  if (!options.skipHeader) header('Installing humanizer')

  loading('installing humanizer...')

  const isGlobal = options.installScope === 'global'
  const skillsArgs = isGlobal
    ? ['skills', 'add', 'https://github.com/blader/humanizer', '--skill', 'humanizer', '-a', 'opencode', '--yes', '-g']
    : ['skills', 'add', 'https://github.com/blader/humanizer', '--skill', 'humanizer', '-a', 'opencode', '--yes']

  try {
    info('Installing humanizer via npx skills')
    const result = await execa('npx', skillsArgs, {
      reject: false,
      timeout: 600000,
      stdio: 'pipe',
    })

    if (result.exitCode === 0) {
      success('humanizer installed')
      return { optedIn: true, installed: true }
    }

    if (result.stderr?.trim()) warn(result.stderr.trim().split('\n').slice(-3).join('\n'))
    warn('humanizer install exited with non-zero code')
    return { optedIn: true, installed: false }
  } catch (err) {
    error(`Failed to install humanizer: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

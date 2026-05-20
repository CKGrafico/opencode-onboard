import { execa } from 'execa'
import { header, success, warn, error, loading } from '../../utils/exec.js'

export async function installCodegraph(options = {}) {
  if (!options.skipHeader) header('Installing codegraph')

  const location = options.installScope === 'global' ? 'global' : 'local'

  loading(`configuring codegraph for opencode (${location})...`)

  try {
    const installResult = await execa(
      'npx',
      ['@colbymchenry/codegraph', 'install', '--target=opencode', `--location=${location}`, '--yes'],
      {
        cwd: process.cwd(),
        reject: false,
        stdio: 'pipe',
      }
    )

    if (installResult.exitCode !== 0) {
      warn('codegraph install exited with non-zero code')
      return { optedIn: true, installed: false }
    }
    success(`codegraph configured for opencode (${location})`)
  } catch (err) {
    error(`Failed to install codegraph: ${err.message}`)
    return { optedIn: true, installed: false }
  }

  loading('initializing codegraph project index...')

  try {
    const initResult = await execa('codegraph', ['init'], {
      cwd: process.cwd(),
      reject: false,
      stdio: 'pipe',
    })

    if (initResult.exitCode !== 0) {
      warn('codegraph init exited with non-zero code')
      return { optedIn: true, installed: false }
    }
    success('codegraph project index initialized')
  } catch (err) {
    error(`Failed to initialize codegraph: ${err.message}`)
    return { optedIn: true, installed: false }
  }

  return { optedIn: true, installed: true }
}

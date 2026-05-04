import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'node:path'
import { header, success, warn, error, loading, info } from '../utils/exec.js'

const SKILLS_LOCK_CANDIDATES = [
  'skills-lock.json',
  '.skills-lock.json',
  '.skills/skills-lock.json',
]

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
      if (options.skillsProvider !== 'npx-skills') {
        for (const rel of SKILLS_LOCK_CANDIDATES) {
          const abs = path.join(process.cwd(), rel)
          if (await fse.pathExists(abs)) await fse.remove(abs)
        }
      }
      success('caveman installed')
      return { optedIn: true, installed: true }
    } else {
      if (result.stderr?.trim()) warn(result.stderr.trim().split('\n').slice(-3).join('\n'))
      warn('caveman install exited with non-zero code')
      return { optedIn: true, installed: false }
    }
  } catch (err) {
    error(`Failed to install caveman: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

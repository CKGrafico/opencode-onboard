import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'node:path'

export async function readOnboardConfig() {
  const cfgPath = path.join(process.cwd(), '.opencode', 'opencode-onboard.json')
  if (!await fse.pathExists(cfgPath)) return null
  try {
    return await fse.readJson(cfgPath)
  } catch {
    return null
  }
}

export async function ensureGitLongpaths(cwd = process.cwd()) {
  // core.longpaths only matters on Windows; don't touch repo config elsewhere.
  if (process.platform !== 'win32') return false
  try {
    const repoCheck = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd, reject: false })
    if (repoCheck.exitCode !== 0 || repoCheck.stdout.trim() !== 'true') return false

    const configResult = await execa('git', ['config', 'core.longpaths', 'true'], { cwd, reject: false })
    return configResult.exitCode === 0
  } catch {
    return false
  }
}

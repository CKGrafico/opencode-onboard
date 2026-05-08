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

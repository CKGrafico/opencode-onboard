import { select } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { header, success } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLATFORMS_PRESET_PATH = path.resolve(__dirname, '../presets/platforms.json')

const platformsPreset = await fse.readJson(PLATFORMS_PRESET_PATH)

export async function choosePlatform() {
  header('Step 4, Version control platform')

  const platform = await select({
    message: 'Which platform are you using?',
    choices: platformsPreset.map(p => ({ name: p.name, value: p.value })),
  })

  success(`Platform: ${platform === 'github' ? 'GitHub' : 'Azure DevOps'}`)
  return platform
}

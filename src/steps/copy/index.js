import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyContent } from '../../utils/copy.js'
import { error, header, success } from '../../utils/exec.js'
import { patchAgentGuidance, patchAgentsMd, patchArchiveCommand, patchConcurrency } from './agents.js'
import { installSkills } from './skills.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../../../content')

export async function copyContentStep(platform, ctx = {}) {
  header('Step 5, Copying opencode-onboard files')

  const dest = process.cwd()

  try {
    await copyContent(CONTENT_DIR, dest, platform, ctx)
    const rootsFile = path.join(dest, '.agents', 'source-roots.json')
    await fse.ensureDir(path.dirname(rootsFile))
    await fse.writeJson(rootsFile, {
      mode: ctx.sourceMode || 'current',
      roots: ctx.sourceRoots || [dest],
    }, { spaces: 2 })
    await patchAgentGuidance(platform)
    await patchArchiveCommand(platform)
    await patchAgentsMd(ctx)
    await patchConcurrency(ctx)
    await installSkills(platform)
    success('Files copied to project root')
  } catch (err) {
    error(`Failed to copy content: ${err.message}`)
    process.exit(1)
  }
}

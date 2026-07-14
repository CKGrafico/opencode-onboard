import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { success } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const _content = {
  azure: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-az.md'), 'utf-8'),
  github: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-gh.md'), 'utf-8'),
  gitlab: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-gl.md'), 'utf-8'),
  none: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-none.md'), 'utf-8'),
}

const PLATFORM_ARCHIVE_START = '<!-- OB-PLATFORM-ARCHIVE-START -->'
const PLATFORM_ARCHIVE_END = '<!-- OB-PLATFORM-ARCHIVE-END -->'

export async function patchArchiveCommand(platform, cwd = process.cwd()) {
  // platform can be a single string or { backlogPlatform, repoPlatform }
  const repoPlatform = typeof platform === 'object' ? (platform.repoPlatform ?? platform.backlogPlatform ?? 'github') : platform
  const targetPath = path.join(cwd, '.opencode', 'commands', 'archive-plan.md')
  if (!await fse.pathExists(targetPath)) return

  let content = await fse.readFile(targetPath, 'utf-8')
  if (!content.includes(PLATFORM_ARCHIVE_START) || !content.includes(PLATFORM_ARCHIVE_END)) return

  const replacement = _content[repoPlatform]
  if (!replacement) return

  const pattern = new RegExp(`${PLATFORM_ARCHIVE_START}[\\s\\S]*?${PLATFORM_ARCHIVE_END}`)
  content = content.replace(pattern, `${PLATFORM_ARCHIVE_START}\n${replacement.trim()}\n${PLATFORM_ARCHIVE_END}`)
  await fse.writeFile(targetPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  success(`archive-plan.md archive flow injected for platform: ${repoPlatform}`)
}


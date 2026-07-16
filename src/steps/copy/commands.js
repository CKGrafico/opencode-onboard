import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { success } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const _archive = {
  azure: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-az.md'), 'utf-8'),
  github: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-gh.md'), 'utf-8'),
  gitlab: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-gl.md'), 'utf-8'),
  none: await fse.readFile(path.resolve(__dirname, '../../presets/ob-archive-none.md'), 'utf-8'),
}

const _ship = {
  github: await fse.readFile(path.resolve(__dirname, '../../presets/ops-ship/gh.md'), 'utf-8'),
  azure: await fse.readFile(path.resolve(__dirname, '../../presets/ops-ship/az.md'), 'utf-8'),
  gitlab: await fse.readFile(path.resolve(__dirname, '../../presets/ops-ship/gl.md'), 'utf-8'),
}

const _review = {
  github: await fse.readFile(path.resolve(__dirname, '../../presets/ops-review/gh.md'), 'utf-8'),
  azure: await fse.readFile(path.resolve(__dirname, '../../presets/ops-review/az.md'), 'utf-8'),
  gitlab: await fse.readFile(path.resolve(__dirname, '../../presets/ops-review/gl.md'), 'utf-8'),
}

const _backlog = {
  github: await fse.readFile(path.resolve(__dirname, '../../presets/ops-backlog/gh.md'), 'utf-8'),
  azure: await fse.readFile(path.resolve(__dirname, '../../presets/ops-backlog/az.md'), 'utf-8'),
  jira: await fse.readFile(path.resolve(__dirname, '../../presets/ops-backlog/jira.md'), 'utf-8'),
}

// relativePath is POSIX-style relative to the project root; commands live in
// .opencode/commands/, skill-backed procedures (plan-archive, ops-ship) in
// .agents/skills/<name>/SKILL.md.
function patchFile(relativePath, startMarker, endMarker, content, platform, cwd = process.cwd()) {
  const targetPath = path.join(cwd, ...relativePath.split('/'))
  if (!fse.pathExistsSync(targetPath)) return

  let fileContent = fse.readFileSync(targetPath, 'utf-8')
  if (!fileContent.includes(startMarker) || !fileContent.includes(endMarker)) return

  const pattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  fileContent = fileContent.replace(pattern, `${startMarker}\n${content.trim()}\n${endMarker}`)
  fse.writeFileSync(targetPath, `${fileContent.replace(/\s*$/, '')}\n`, 'utf-8')
  success(`${relativePath} content injected for platform: ${platform}`)
}

export async function patchArchiveCommand(platform, cwd = process.cwd()) {
  const repoPlatform = typeof platform === 'object' ? (platform.repoPlatform ?? platform.backlogPlatform ?? 'github') : platform
  const replacement = _archive[repoPlatform]
  if (!replacement) return
  patchFile('.agents/skills/ob-plan-archive/SKILL.md', '<!-- OB-PLATFORM-ARCHIVE-START -->', '<!-- OB-PLATFORM-ARCHIVE-END -->', replacement, repoPlatform, cwd)
}

export async function patchOpsShip(platform, cwd = process.cwd()) {
  const repoPlatform = typeof platform === 'object' ? (platform.repoPlatform ?? 'github') : platform
  const replacement = _ship[repoPlatform]
  if (!replacement) return
  patchFile('.agents/skills/ob-ops-ship/SKILL.md', '<!-- OB-PLATFORM-SHIP-START -->', '<!-- OB-PLATFORM-SHIP-END -->', replacement, repoPlatform, cwd)
}

export async function patchOpsReview(platform, cwd = process.cwd()) {
  const repoPlatform = typeof platform === 'object' ? (platform.repoPlatform ?? 'github') : platform
  const replacement = _review[repoPlatform]
  if (!replacement) return
  patchFile('.opencode/commands/ops-review.md', '<!-- OB-PLATFORM-REVIEW-START -->', '<!-- OB-PLATFORM-REVIEW-END -->', replacement, repoPlatform, cwd)
}

export async function patchOpsBacklog(platform, cwd = process.cwd()) {
  const backlogPlatform = typeof platform === 'object' ? (platform.backlogPlatform ?? 'github') : platform
  const replacement = _backlog[backlogPlatform]
  if (!replacement) return
  patchFile('.opencode/commands/ops-backlog.md', '<!-- OB-PLATFORM-BACKLOG-START -->', '<!-- OB-PLATFORM-BACKLOG-END -->', replacement, backlogPlatform, cwd)
}


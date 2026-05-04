import fse from 'fs-extra'
import path from 'path'
import { findAiFiles } from '../utils/copy.js'
import { header, info, success, warn } from '../utils/exec.js'

// Files/dirs that are valuable pre-existing work, never removed
const PRESERVE = ['DESIGN.md', 'ARCHITECTURE.md', 'openspec']

/**
 * Enumerate immediate children of a directory.
 * Skips 'skills' to preserve user-installed skills.
 */
async function childrenExcludingSkills(dir) {
  const results = []
  if (!await fse.pathExists(dir)) return results
  const entries = await fse.readdir(dir)
  for (const entry of entries) {
    if (entry === 'skills') continue
    results.push(path.join(dir, entry))
  }
  return results
}

/**
 * Returns true if the file exists and has real content (not empty, not a prompt template).
 * Prompt templates contain a specific marker written by the onboard CLI.
 */
async function isPopulated(filePath) {
  if (!await fse.pathExists(filePath)) return false
  const content = await fse.readFile(filePath, 'utf-8')
  const trimmed = content.trim()
  if (!trimmed) return false
  // DESIGN.md and ARCHITECTURE.md shipped as prompt templates contain this marker
  if (trimmed.startsWith('<!-- onboard-prompt')) return false
  return true
}

/**
 * Returns true if openspec/ exists and has at least one change or archive entry.
 */
async function hasOpenspecHistory(cwd) {
  const changesDir = path.join(cwd, 'openspec', 'changes')
  const archiveDir = path.join(cwd, 'openspec', 'archive')
  if (await fse.pathExists(changesDir)) {
    const entries = await fse.readdir(changesDir)
    if (entries.length > 0) return true
  }
  if (await fse.pathExists(archiveDir)) {
    const entries = await fse.readdir(archiveDir)
    if (entries.length > 0) return true
  }
  return false
}

export async function cleanAiFiles() {
  header('Step 3, Existing AI config files')

  const cwd = process.cwd()

  // Detect what should be preserved before touching anything
  const ctx = {
    hasDesign: await isPopulated(path.join(cwd, 'DESIGN.md')),
    hasArchitecture: await isPopulated(path.join(cwd, 'ARCHITECTURE.md')),
    hasOpenspec: await hasOpenspecHistory(cwd),
  }

  if (ctx.hasDesign) info('DESIGN.md exists and is populated, keeping it')
  if (ctx.hasArchitecture) info('ARCHITECTURE.md exists and is populated, keeping it')
  if (ctx.hasOpenspec) info('openspec/ history exists, keeping it')

  // Build the list of files to remove
  const flatFiles = await findAiFiles(cwd)
  const dirTargets = ['.opencode', '.agents']
  const dirEntries = []
  for (const dirName of dirTargets) {
    const dirPath = path.join(cwd, dirName)
    const children = await childrenExcludingSkills(dirPath)
    dirEntries.push(...children)
  }

  // Remove directory targets themselves from flat list (handled via children)
  // Also remove any preserved entries
  const filteredFlat = flatFiles.filter(f => {
    const rel = path.relative(cwd, f)
    if (dirTargets.includes(rel)) return false
    if (PRESERVE.some(p => rel === p || rel.startsWith(p + path.sep))) return false
    return true
  })

  const allToRemove = [...filteredFlat, ...dirEntries]

  if (allToRemove.length === 0) {
    success('No existing AI config files to remove')
    return ctx
  }

  warn('Removing existing AI config files:')
  for (const f of allToRemove) {
    info('  ' + f.replace(cwd + path.sep, ''))
    await fse.remove(f)
  }
  success('Removed existing AI config files')

  return ctx
}

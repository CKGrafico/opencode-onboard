import fse from 'fs-extra'
import path from 'path'
import { findAiFiles } from '../utils/copy.js'
import { header, info, prompt, success, warn } from '../utils/exec.js'

/**
 * Enumerate immediate children of a directory, returning their absolute paths.
 * Skips any entry named 'skills' at any level to preserve user-installed skills.
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

export async function cleanAiFiles() {
  header('Step 2, Existing AI config files')

  const cwd = process.cwd()

  // Flat AI config files (not directories)
  const flatFiles = await findAiFiles(cwd)

  // For directory targets (.opencode, .agents), enumerate children and skip skills/
  const dirTargets = ['.opencode', '.agents']
  const dirEntries = []
  for (const dirName of dirTargets) {
    const dirPath = path.join(cwd, dirName)
    const children = await childrenExcludingSkills(dirPath)
    dirEntries.push(...children)
  }

  // Remove the directory targets themselves from flat list (we handle them via children)
  const filteredFlat = flatFiles.filter(f => {
    const rel = path.relative(cwd, f)
    return !dirTargets.includes(rel)
  })

  const allFiles = [...filteredFlat, ...dirEntries]

  if (allFiles.length === 0) {
    success('No existing AI config files found')
    return
  }

  warn('Found the following AI config files:')
  for (const f of allFiles) {
    info(f.replace(cwd, '.'))
  }
  console.log()
  prompt('Press Enter to remove them all (skills/ folders will be kept)')
  console.log()

  await new Promise(resolve => {
    process.stdin.resume()
    process.stdin.once('data', () => {
      process.stdin.pause()
      resolve()
    })
  })

  for (const f of allFiles) {
    await fse.remove(f)
  }
  success('Removed existing AI config files')
}

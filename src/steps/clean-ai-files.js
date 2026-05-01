import fse from 'fs-extra'
import path from 'path'
import { findAiFiles } from '../utils/copy.js'
import { header, info, success, warn } from '../utils/exec.js'

export async function cleanAiFiles() {
  header('Step 2, Existing AI config files')

  const cwd = process.cwd()
  const found = await findAiFiles(cwd)

  // Also find .opencode contents except skills/ (preserve user skills)
  const opencodeDir = path.join(cwd, '.opencode')
  const opencodeEntries = []
  if (await fse.pathExists(opencodeDir)) {
    const entries = await fse.readdir(opencodeDir)
    for (const entry of entries) {
      if (entry !== 'skills') {
        opencodeEntries.push(path.join(opencodeDir, entry))
      }
    }
  }

  const allFiles = [...found, ...opencodeEntries]

  if (allFiles.length === 0) {
    success('No existing AI config files found')
    return
  }

  warn('Found the following AI config files:')
  for (const f of allFiles) {
    info(f.replace(cwd, '.'))
  }
  console.log()
  info('Press Enter to remove them all (your .opencode/skills/ will be kept)')
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

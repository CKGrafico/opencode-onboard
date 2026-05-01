import { confirm } from '@inquirer/prompts'
import fse from 'fs-extra'
import { findAiFiles } from '../utils/copy.js'
import { header, info, success, warn } from '../utils/exec.js'

export async function cleanAiFiles() {
  header('Step 2, Existing AI config files')

  const cwd = process.cwd()
  const found = await findAiFiles(cwd)

  if (found.length === 0) {
    success('No existing AI config files found')
    return
  }

  warn('Found the following AI config files in your project:')
  for (const f of found) {
    info(f.replace(cwd, '.'))
  }
  console.log()

  const shouldDelete = await confirm({
    message: 'Delete them? (opencode-onboard will create fresh ones)',
    default: true,
  })

  if (shouldDelete) {
    for (const f of found) {
      await fse.remove(f)
    }
    success('Removed existing AI config files')
  } else {
    warn('Skipped, existing files kept. They may conflict with copied content.')
  }
}

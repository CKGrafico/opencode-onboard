import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { error, header, success, warn } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Our owned apply command and skill, stored in the package content folder.
// After openspec init generates its versions, we delete them and copy ours in.
const OUR_CONTENT_DIR = path.resolve(__dirname, '../../content')

const APPLY_OVERRIDES = [
  {
    src: path.join(OUR_CONTENT_DIR, '.opencode', 'commands', 'opsx-apply.md'),
    dest: path.join('.opencode', 'commands', 'opsx-apply.md'),
  },
  {
    src: path.join(OUR_CONTENT_DIR, '.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
    dest: path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
  },
]

export async function initOpenspec() {
  header('Step 6, Initializing OpenSpec')

  try {
    const result = await execa('npx', ['@fission-ai/openspec', 'init', '--tools', 'opencode', '--force'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      reject: false,
    })

    if (result.exitCode === 0) {
      success('OpenSpec initialized')
    } else {
      warn('OpenSpec init exited with non-zero code, check output above')
    }
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`)
  }

  // Replace the openspec-generated apply command and skill with our ensemble-native versions.
  // The generated files implement tasks directly (solo agent). Ours delegate to the ensemble team.
  for (const { src, dest } of APPLY_OVERRIDES) {
    const destAbs = path.join(process.cwd(), dest)
    try {
      await fse.copy(src, destAbs, { overwrite: true })
      success(`Installed ensemble apply → ${dest}`)
    } catch (err) {
      warn(`Could not install ${dest}: ${err.message}`)
    }
  }
}

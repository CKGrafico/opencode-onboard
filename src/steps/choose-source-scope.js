import { checkbox, select } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { header, info, success, warn } from '../utils/exec.js'

async function listParentFolders(cwd) {
  const parent = path.resolve(cwd, '..')
  const entries = await fse.readdir(parent)
  const dirs = []

  for (const name of entries) {
    if (name.startsWith('.')) continue
    const abs = path.join(parent, name)
    try {
      const stat = await fse.stat(abs)
      if (!stat.isDirectory()) continue
      if (path.resolve(abs) === path.resolve(cwd)) continue
      dirs.push({ name, abs })
    } catch {
      // ignore invalid entries
    }
  }

  dirs.sort((a, b) => a.name.localeCompare(b.name))
  return dirs
}

export async function chooseSourceScope() {
  header('Step 2, Source code scope')

  const cwd = process.cwd()
  info('Choose where agents should read source code from during init analysis.')

  const mode = await select({
    message: 'Source code location:',
    default: 'current',
    choices: [
      {
        name: 'Current folder (default)',
        value: 'current',
        description: 'Use this repository only',
      },
      {
        name: 'Select folders in parent (../)',
        value: 'parent',
        description: 'Use when this repo only contains agent config',
      },
    ],
  })

  if (mode === 'current') {
    success(`Source scope: ${cwd}`)
    return { sourceMode: 'current', sourceRoots: [cwd] }
  }

  const parentFolders = await listParentFolders(cwd)
  if (parentFolders.length === 0) {
    warn('No sibling folders found in parent directory. Falling back to current folder.')
    success(`Source scope: ${cwd}`)
    return { sourceMode: 'current', sourceRoots: [cwd] }
  }

  const selected = await checkbox({
    message: 'Select source folders from parent directory:',
    choices: parentFolders.map(d => ({
      name: `../${d.name}`,
      value: d.abs,
      checked: true,
    })),
    required: true,
  })

  if (!selected || selected.length === 0) {
    warn('No folders selected. Falling back to current folder.')
    success(`Source scope: ${cwd}`)
    return { sourceMode: 'current', sourceRoots: [cwd] }
  }

  success(`Source scope: ${selected.map(p => path.basename(p)).join(', ')}`)
  return { sourceMode: 'parent-selected', sourceRoots: selected }
}

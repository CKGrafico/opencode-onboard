import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'
import { header, success, warn, error, loading } from '../../utils/exec.js'

/**
 * After codegraph install, it may create an `opencode.jsonc` at the project root.
 * This project uses `.opencode/opencode.json` instead. Merge any MCP config from
 * the rogue file into the correct location and remove it.
 * Returns true if config was successfully merged (or no rogue file existed), false on parse failure.
 */
export async function fixCodegraphConfig() {
  const cwd = process.cwd()
  const rogueFile = path.join(cwd, 'opencode.jsonc')
  const correctFile = path.join(cwd, '.opencode', 'opencode.json')

  if (!await fse.pathExists(rogueFile)) return true

  let rogueContent
  try {
    const raw = await fse.readFile(rogueFile, 'utf-8')
    const errors = []
    rogueContent = parseJsonc(raw, errors)
    if (errors.length > 0) throw new Error(`parse errors: ${errors.length}`)
    if (!rogueContent || typeof rogueContent !== 'object' || Array.isArray(rogueContent)) {
      throw new Error('unexpected structure')
    }
  } catch {
    warn('Could not parse opencode.jsonc, removing it')
    await fse.remove(rogueFile)
    return false
  }

  let correctContent = {}
  if (await fse.pathExists(correctFile)) {
    try {
      correctContent = await fse.readJson(correctFile)
    } catch {
      // ignore invalid existing config
    }
  }

  const rogueMcp = rogueContent.mcpServers || rogueContent.mcp
  if (rogueMcp) {
    for (const entry of Object.values(rogueMcp)) {
      if (Array.isArray(entry.command) && entry.command[0] === 'codegraph') {
        entry.command = ['npx', '--yes', '@colbymchenry/codegraph', ...entry.command.slice(1)]
      }
    }
    correctContent.mcp = { ...(correctContent.mcp || {}), ...rogueMcp }
  }

  await fse.ensureDir(path.dirname(correctFile))
  await fse.writeJson(correctFile, correctContent, { spaces: 2 })
  await fse.remove(rogueFile)
  warn('Migrated codegraph config from opencode.jsonc → .opencode/opencode.json (removed opencode.jsonc)')

  return true
}

export async function installCodegraph(options = {}) {
  if (!options.skipHeader) header('Installing codegraph')

  const location = options.installScope === 'global' ? 'global' : 'local'

  loading(`configuring codegraph for opencode (${location})...`)

  try {
    const installResult = await execa(
      'npx',
      ['@colbymchenry/codegraph', 'install', '--target=opencode', `--location=${location}`, '--yes'],
      {
        cwd: process.cwd(),
        reject: false,
        stdio: 'pipe',
      }
    )

    if (installResult.exitCode !== 0) {
      warn('codegraph install exited with non-zero code')
      return { optedIn: true, installed: false }
    }

    const configFixed = await fixCodegraphConfig()

    if (!configFixed) {
      warn('codegraph config could not be merged — skipping init')
      return { optedIn: true, installed: false }
    }

    success(`codegraph configured for opencode (${location})`)
  } catch (err) {
    error(`Failed to install codegraph: ${err.message}`)
    return { optedIn: true, installed: false }
  }

  loading('initializing codegraph project index...')

  try {
    const initResult = await execa('npx', ['--yes', '@colbymchenry/codegraph', 'init'], {
      cwd: process.cwd(),
      reject: false,
      stdio: 'pipe',
    })

    if (initResult.exitCode !== 0) {
      warn('codegraph init exited with non-zero code')
      return { optedIn: true, installed: false }
    }
    success('codegraph project index initialized')
  } catch (err) {
    error(`Failed to initialize codegraph: ${err.message}`)
    return { optedIn: true, installed: false }
  }

  return { optedIn: true, installed: true }
}

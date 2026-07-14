import { execa } from 'execa'
import { addSkillToLock } from './skills-lock.js'
import fse from 'fs-extra'
import path from 'node:path'
import { commandExists, error, info, loading, success, warn } from '../../utils/exec.js'

/**
 * Configures the basic-memory MCP server in .opencode/opencode.json
 * and installs the basic-memory skill.
 *
 * basic-memory runs via `basic-memory mcp` (stdio, no Docker).
 * Requires uv: https://docs.astral.sh/uv/getting-started/installation/
 * Skill source: https://github.com/basicmachines-co/basic-memory (skills/ directory)
 */
export async function installMemory(options = {}) {
  if (!options.skipHeader) info('Configuring basic-memory knowledge graph...')

  loading('checking uv...')
  const uvAvailable = await commandExists('uv')
  if (!uvAvailable) {
    warn('uv not found on PATH. basic-memory requires uv to run.')
    warn('Install uv from https://docs.astral.sh/uv/getting-started/installation/')
  }

  // Pre-install basic-memory so the `basic-memory` binary is on PATH.
  // `uv tool install` puts it in ~/.local/bin (or equivalent),
  // so opencode can call `basic-memory mcp` directly: no uvx resolution delay.
  loading('installing basic-memory (this may take a minute)...')
  try {
    const installResult = await execa('uv', ['tool', 'install', 'basic-memory'], {
      reject: false,
      timeout: 300000,
      stdio: 'pipe',
    })
    if (installResult.exitCode === 0) {
      success('basic-memory installed')
    } else {
      warn('basic-memory install exited with non-zero code: MCP may be slow on first connect')
    }
  } catch (err) {
    warn(`basic-memory install failed: ${err.message}`)
  }

  // Configure MCP server in .opencode/opencode.json
  try {
    const opencodeDir = path.join(process.cwd(), '.opencode')
    const opencodePath = path.join(opencodeDir, 'opencode.json')

    const opencode = await fse.pathExists(opencodePath)
      ? await fse.readJson(opencodePath)
      : { $schema: 'https://opencode.ai/config.json' }

    if (!opencode.mcp) opencode.mcp = {}
    if (!opencode.mcp['basic-memory']) {
      opencode.mcp['basic-memory'] = {
        type: 'local',
        command: ['basic-memory', 'mcp'],
        enabled: true,
        timeout: 300000,
      }
    }

    await fse.ensureDir(opencodeDir)
    await fse.writeJson(opencodePath, opencode, { spaces: 2 })
    success('basic-memory MCP server configured in .opencode/opencode.json')
  } catch (err) {
    error(`Failed to configure basic-memory MCP: ${err.message}`)
    return { optedIn: true, installed: false, uvAvailable }
  }

  // Add basic-memory skill to skills-lock.json for batch install
  await addSkillToLock('basic-memory', {
    source: 'basicmachines-co/basic-memory',
    sourceType: 'github',
    skillPath: 'skills/basic-memory/SKILL.md',
  })

  info('Notes stored in ~/basic-memory by default.')
  info('To use a project-specific path: basic-memory project add <name> <path>')

  return { optedIn: true, installed: true, uvAvailable }
}

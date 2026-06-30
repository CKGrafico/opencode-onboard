import fse from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const optimizationPreset = await fse.readJson(path.resolve(__dirname, '../../presets/optimization.json'))

const RTK_START = '<!-- OB-RTK-START -->'
const RTK_END = '<!-- OB-RTK-END -->'
const CAVEMAN_START = '<!-- OB-CAVEMAN-START -->'
const CAVEMAN_END = '<!-- OB-CAVEMAN-END -->'
const CODEGRAPH_START = '<!-- OB-CODEGRAPH-START -->'
const CODEGRAPH_END = '<!-- OB-CODEGRAPH-END -->'
const MEMORY_START = '<!-- OB-MEMORY-START -->'
const MEMORY_END = '<!-- OB-MEMORY-END -->'

function section(tool, enabled) {
  return enabled ? optimizationPreset.guidance[tool].enabled : optimizationPreset.guidance[tool].disabled
}

function replaceBetween(content, start, end, replacement) {
  if (!content.includes(start) || !content.includes(end)) return content
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  return content.replace(pattern, `${start}\n${replacement.trim()}\n${end}`)
}

export async function configureAgentsMd(tokenOpt = {}) {
  const cwd = process.cwd()
  const agentsMdPath = path.join(cwd, 'AGENTS.md')

  if (!await fse.pathExists(agentsMdPath)) {
    warn('AGENTS.md not found, skipping optimization markers')
    return { configured: false }
  }

  let content = await fse.readFile(agentsMdPath, 'utf-8')
  content = replaceBetween(content, RTK_START, RTK_END, section('rtk', !!tokenOpt?.rtk?.optedIn))
  content = replaceBetween(content, CAVEMAN_START, CAVEMAN_END, section('caveman', !!tokenOpt?.caveman?.optedIn))
  content = replaceBetween(content, CODEGRAPH_START, CODEGRAPH_END, section('codegraph', !!tokenOpt?.codegraph?.optedIn))
  content = replaceBetween(content, MEMORY_START, MEMORY_END, section('memory', !!tokenOpt?.memory?.optedIn))
  await fse.writeFile(agentsMdPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  success('AGENTS.md optimization markers updated')
  return { configured: true, path: agentsMdPath }
}

export async function patchCommandFiles(tokenOpt = {}) {
  const cwd = process.cwd()
  const commandsDir = path.join(cwd, '.opencode', 'commands')

  if (!await fse.pathExists(commandsDir)) {
    warn('.opencode/commands/ not found, skipping command file optimization markers')
    return { configured: false }
  }

  const markers = optimizationPreset.commandMarkers
  const codegraphEnabled = !!tokenOpt?.codegraph?.optedIn
  const memoryEnabled = !!tokenOpt?.memory?.optedIn

  let patched = 0
  const entries = await fse.readdir(commandsDir)
  for (const file of entries) {
    if (!file.endsWith('.md')) continue
    const filePath = path.join(commandsDir, file)
    let content = await fse.readFile(filePath, 'utf-8')
    let changed = false

    if (content.includes(markers.codegraph.start) && content.includes(markers.codegraph.end)) {
      const replacement = codegraphEnabled ? markers.codegraph.enabled : markers.codegraph.disabled
      content = replaceBetween(content, markers.codegraph.start, markers.codegraph.end, replacement)
      changed = true
    }

    if (content.includes(markers.memory.start) && content.includes(markers.memory.end)) {
      const replacement = memoryEnabled ? markers.memory.enabled : markers.memory.disabled
      content = replaceBetween(content, markers.memory.start, markers.memory.end, replacement)
      changed = true
    }

    if (changed) {
      await fse.writeFile(filePath, content, 'utf-8')
      patched++
    }
  }

  if (patched > 0) {
    success(`${patched} command file(s) optimization markers updated`)
  }
  return { configured: true, patched }
}

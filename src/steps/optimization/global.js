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

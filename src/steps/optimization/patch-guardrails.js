import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GUARDRAILS_PRESET_DIR = path.resolve(__dirname, '../../../src/presets/guardrails')

const MARKER_SECTIONS = {
  rtk: 'RTK',
  codegraph: 'CODEGRAPH',
  memory: 'MEMORY',
  caveman: 'CAVEMAN',
  humanizer: 'HUMANIZER',
}

export async function patchGuardrails(selections = {}) {
  const destSkillsDir = path.join(process.cwd(), '.agents', 'skills')
  const guardrailsPath = path.join(destSkillsDir, 'ob-generic-guardrails', 'SKILL.md')

  if (!await fse.pathExists(guardrailsPath)) {
    info('ob-generic-guardrails not found, skipping guardrails patching')
    return { patched: false }
  }

  let content = await fse.readFile(guardrailsPath, 'utf-8')
  let patchedCount = 0

  for (const [key, markerSuffix] of Object.entries(MARKER_SECTIONS)) {
    const startMarker = `<!-- OB-GUARDRAILS-${markerSuffix}-START -->`
    const endMarker = `<!-- OB-GUARDRAILS-${markerSuffix}-END -->`

    if (!content.includes(startMarker) || !content.includes(endMarker)) continue

    let sectionContent = ''
    if (selections[key]) {
      const presetPath = path.join(GUARDRAILS_PRESET_DIR, `${key}.md`)
      if (await fse.pathExists(presetPath)) {
        sectionContent = (await fse.readFile(presetPath, 'utf-8')).trim()
      }
    }

    const pattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    content = content.replace(pattern, `${startMarker}\n${sectionContent}\n${endMarker}`)
    if (selections[key]) patchedCount++
  }

  await fse.writeFile(guardrailsPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  success(`Guardrails patched: ${patchedCount} sections injected`)
  return { patched: true, count: patchedCount }
}

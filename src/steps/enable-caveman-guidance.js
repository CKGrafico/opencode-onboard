import path from 'node:path'
import fse from 'fs-extra'
import { info, success, warn } from '../utils/exec.js'

const MARKER_START = '<!-- CAVEMAN-GUIDANCE-START -->'
const MARKER_END = '<!-- CAVEMAN-GUIDANCE-END -->'

const AGENTS_BLOCK = `${MARKER_START}
## Caveman Mode (Optional)

If caveman is installed, prefer concise responses by default to reduce token usage while keeping full technical accuracy.

Treat any of these as a direct trigger to enable concise style:
- "talk like caveman"
- "caveman mode"
- "less tokens please"

When enabled:
- Keep explanations short and direct
- Prioritize exact commands, paths, and outcomes
- Avoid filler, greetings, and repeated context

The user can disable it with phrases like: "normal mode" or "stop caveman".
${MARKER_END}`

const OPSX_BLOCK = `${MARKER_START}
## Caveman Output Style

If the user requests "talk like caveman", "caveman mode", or "less tokens please", keep all status updates concise:
- Report only key actions, blockers, and next commands
- Keep completion updates brief and factual
- Preserve technical precision; compress wording only
${MARKER_END}`

async function appendBlockIfMissing(filePath, block) {
  if (!await fse.pathExists(filePath)) return { ok: false, reason: 'missing-file' }

  const current = await fse.readFile(filePath, 'utf-8')
  if (current.includes(MARKER_START)) return { ok: true, changed: false }

  const next = `${current.replace(/\s*$/, '')}\n\n${block}\n`
  await fse.writeFile(filePath, next, 'utf-8')
  return { ok: true, changed: true }
}

export async function enableCavemanGuidance(cavemanResult) {
  if (!cavemanResult?.installed) {
    info('Caveman guidance skipped (caveman not installed)')
    return { enabled: false }
  }

  const targets = [
    { rel: 'AGENTS.md', block: AGENTS_BLOCK },
  ]

  const commandsDir = path.join(process.cwd(), '.opencode', 'commands')
  if (await fse.pathExists(commandsDir)) {
    const entries = await fse.readdir(commandsDir)
    for (const name of entries) {
      if (!/^opsx-.*\.md$/i.test(name)) continue
      targets.push({ rel: path.join('.opencode', 'commands', name), block: OPSX_BLOCK })
    }
  }

  const skillsDir = path.join(process.cwd(), '.opencode', 'skills')
  if (await fse.pathExists(skillsDir)) {
    const skillEntries = await fse.readdir(skillsDir)
    for (const dirName of skillEntries) {
      if (!/^openspec-/i.test(dirName)) continue
      targets.push({ rel: path.join('.opencode', 'skills', dirName, 'SKILL.md'), block: OPSX_BLOCK })
    }
  }

  let changedCount = 0
  for (const target of targets) {
    const abs = path.join(process.cwd(), target.rel)
    try {
      const res = await appendBlockIfMissing(abs, target.block)
      if (!res.ok) {
        warn(`Could not apply caveman guidance to ${target.rel} (${res.reason})`)
      } else if (res.changed) {
        changedCount++
      }
    } catch (err) {
      warn(`Could not apply caveman guidance to ${target.rel}: ${err.message}`)
    }
  }

  if (changedCount > 0) success('Caveman guidance enabled in AGENTS/OpenSpec prompts')
  else info('Caveman guidance already present')

  return { enabled: true, patchedFiles: changedCount }
}

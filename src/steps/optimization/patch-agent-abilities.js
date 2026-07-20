import fse from 'fs-extra'
import path from 'path'
import { info, success, warn } from '../../utils/exec.js'

/**
 * When the user opts in to caveman/humanizer during the optimization step,
 * those skills are installed via skills-lock.json. But they also need to be
 * added to every agent's ## Abilities (Guardrails line) so the startup
 * directive loads them via the skill tool.
 *
 * This function patches every *-engineer.md in .opencode/agents/ to add
 * the opted-in skills to the Guardrails line, if they're not already there.
 *
 * Only runs during the optimization step, after skills are installed.
 */
export async function patchAgentAbilities(selections = {}) {
  const agentsDir = path.join(process.cwd(), '.opencode', 'agents')
  if (!await fse.pathExists(agentsDir)) {
    info('No .opencode/agents directory found, skipping agent abilities patch')
    return { patched: false }
  }

  // Build the list of skills to add to the Guardrails line
  const skillsToAdd = []
  if (selections.caveman) skillsToAdd.push('caveman')
  if (selections.humanizer) skillsToAdd.push('humanizer')

  if (skillsToAdd.length === 0) {
    return { patched: false, reason: 'no optimization skills selected' }
  }

  const files = await fse.readdir(agentsDir)
  const engineerFiles = files.filter(
    (f) => f.endsWith('-engineer.md') && !f.includes('.build.') && !f.includes('.fast.') && !f.includes('.plan.')
  )

  let patchedCount = 0

  for (const file of engineerFiles) {
    const filePath = path.join(agentsDir, file)
    let content = await fse.readFile(filePath, 'utf-8')
    let modified = false

    for (const skillName of skillsToAdd) {
      // Match the Guardrails line: "- Guardrails: @ob-guardrails-generic, @ob-guardrails-project, ..."
      // We need to add @skillName to this line if it's not already there.
      const guardrailsLineRegex = /^(- Guardrails:)(.+)$/m
      const match = content.match(guardrailsLineRegex)

      if (!match) {
        warn(`No Guardrails line found in ${file}, skipping`)
        continue
      }

      const currentLine = match[0]
      if (currentLine.includes(`@${skillName}`)) {
        // Already present, skip
        continue
      }

      // Add @skillName right after @ob-guardrails-project (or at the end of the line if not found)
      const projectMarker = '@ob-guardrails-project'
      let newLine

      if (currentLine.includes(projectMarker)) {
        newLine = currentLine.replace(projectMarker, `${projectMarker}, @${skillName}`)
      } else {
        // Fallback: add before the line ending
        newLine = currentLine.replace(/(\s*)$/, `, @${skillName}$1`)
      }

      content = content.replace(currentLine, newLine)
      modified = true
      info(`Added @${skillName} to Guardrails line in ${file}`)
    }

    if (modified) {
      await fse.writeFile(filePath, content, 'utf-8')
      patchedCount++
    }
  }

  if (patchedCount > 0) {
    success(`Agent abilities patched: ${skillsToAdd.join(', ')} added to ${patchedCount} agent file(s)`)
  }

  return { patched: true, count: patchedCount, skills: skillsToAdd }
}

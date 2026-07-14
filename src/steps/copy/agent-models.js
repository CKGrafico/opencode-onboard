import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

/**
 * Insert or replace the `model:` field inside a markdown agent's YAML frontmatter.
 * If the file has no frontmatter, a minimal one is created.
 */
export function setFrontmatterModel(content, model) {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) {
    return `---\nmodel: ${model}\n---\n\n${content}`
  }
  const body = fm[1]
  const newBody = /^model:\s*.*$/m.test(body)
    ? body.replace(/^model:\s*.*$/m, `model: ${model}`)
    : `${body}\nmodel: ${model}`
  return content.replace(fm[0], `---\n${newBody}\n---`)
}

function hasFrontmatterModel(content) {
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return fm ? /^model:\s*\S/m.test(fm[1]) : false
}

/**
 * Stamp a per-tier model onto each engineer agent file, since OpenCode resolves
 * a subagent's model from its agent definition (there is no per-spawn override).
 * One file per engineer — no variants. `fullstack-engineer` runs on the cheap `fast`
 * model; any other engineer present defaults to the capable `build` model.
 *
 * Files that already declare a `model:` are left untouched, so custom engineers
 * created with a specific tier (via /create-engineer) keep their choice on
 * re-runs. /make-user-model re-stamps when a tier's model changes.
 */
export async function stampAgentModels({ models = {}, cwd = process.cwd() } = {}) {
  const agentsDir = path.join(cwd, '.opencode', 'agents')
  if (!(await fse.pathExists(agentsDir))) return { stamped: 0 }

  const files = (await fse.readdir(agentsDir)).filter(f => f.endsWith('-engineer.md'))

  let stamped = 0
  for (const file of files) {
    const filePath = path.join(agentsDir, file)
    const content = await fse.readFile(filePath, 'utf-8')
    if (hasFrontmatterModel(content)) continue

    const tier = file === 'fullstack-engineer.md' ? 'fast' : 'build'
    const model = models[tier]
    if (!model) continue

    await fse.writeFile(filePath, setFrontmatterModel(content, model), 'utf-8')
    stamped++
  }

  if (stamped > 0) success(`Stamped per-agent models on ${stamped} engineer file(s)`)
  return { stamped }
}

import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

// Engineers get one variant per implementation tier. `plan` is the lead/primary
// session model, not a subagent variant, so it is intentionally excluded.
const TIERS = ['build', 'fast']

const VARIANT_SUFFIX_RE = /-(build|fast)\.md$/

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

/**
 * Generate `<engineer>-build` / `<engineer>-fast` agent files from each base
 * `*-engineer.md`, stamping the per-tier model from wizard.models. A task's
 * `agent` + `modeltype` annotation maps directly to one of these files, so the
 * native task tool spawns the subagent on the right model with no apply-time
 * resolution. Re-running regenerates variants (used by /ob-set-model).
 */
export async function generateAgentVariants({ models = {}, cwd = process.cwd() } = {}) {
  const agentsDir = path.join(cwd, '.opencode', 'agents')
  if (!(await fse.pathExists(agentsDir))) return { generated: 0 }

  const files = (await fse.readdir(agentsDir)).filter(
    f => f.endsWith('-engineer.md') && !VARIANT_SUFFIX_RE.test(f)
  )

  let generated = 0
  for (const file of files) {
    const baseName = file.replace(/\.md$/, '')
    const base = await fse.readFile(path.join(agentsDir, file), 'utf-8')
    for (const tier of TIERS) {
      const model = models[tier]
      if (!model) continue
      const variant = setFrontmatterModel(base, model)
      await fse.writeFile(path.join(agentsDir, `${baseName}-${tier}.md`), variant, 'utf-8')
      generated++
    }
  }

  if (generated > 0) success(`Generated ${generated} agent variant(s) with per-tier models`)
  return { generated }
}

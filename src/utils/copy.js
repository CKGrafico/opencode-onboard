import fse from 'fs-extra'
import path from 'path'

// Folders never copied (skills handled separately by installSkills, .bootstrap is internal tooling)
// These are excluded from the general content copy, they are installed separately
// by initOpenspec after openspec init runs, so our versions win over the generated ones.
const ALWAYS_EXCLUDE = ['.bootstrap', 'skills', 'node_modules']
const OPENSPEC_APPLY_FILES = [
  path.join('.opencode', 'commands', 'opsx-apply.md'),
  path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
]

/**
 * Copy content/ directory to destination.
 * Excludes:
 *   - .agents/skills and .opencode/skills (handled separately)
 *   - .bootstrap (internal tooling)
 *   - node_modules
 *   - opsx-apply.md and openspec-apply-change/SKILL.md (installed by initOpenspec)
 *   - DESIGN.md and ARCHITECTURE.md if ctx says they already exist (preserve user's files)
 * @param {string} contentDir - absolute path to content/
 * @param {string} destDir - absolute path to destination (project root)
 * @param {'azure'|'github'} platform
 * @param {{ hasDesign?: boolean, hasArchitecture?: boolean }} ctx
 */
export async function copyContent(contentDir, destDir, platform, ctx = {}) {
  await fse.copy(contentDir, destDir, {
    overwrite: false,
    filter: (src) => {
      const rel = path.relative(contentDir, src)
      const parts = rel.split(path.sep)
      if (parts.some(part => ALWAYS_EXCLUDE.includes(part))) return false
      if (OPENSPEC_APPLY_FILES.some(f => rel === f)) return false
      if (ctx.hasDesign && rel === 'DESIGN.md') return false
      if (ctx.hasArchitecture && rel === 'ARCHITECTURE.md') return false
      return true
    },
  })
}

export async function findAiFiles(dir, files) {
  const found = []
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (await fse.pathExists(fullPath)) {
      found.push(fullPath)
    }
  }
  return found
}

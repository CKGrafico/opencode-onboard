import fse from 'fs-extra'
import path from 'path'

// Folders never copied (skills handled separately by chooseSkillsProvider, .bootstrap is internal tooling)
// These are excluded from the general content copy, they are installed separately
// by initOpenspec after openspec init runs, so our versions win over the generated ones.
const ALWAYS_EXCLUDE = ['.bootstrap', 'skills', 'node_modules']
const OPENSPEC_APPLY_FILES = [
  path.join('.opencode', 'commands', 'opsx-apply.md'),
  path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
]

/**
 * Copy content/ directory to destination, excluding skills (handled separately by chooseSkillsProvider)
 * and internal bootstrap tooling.
 * @param {string} contentDir - absolute path to content/
 * @param {string} destDir - absolute path to destination (project root)
 * @param {'azure'|'github'} platform
 */
export async function copyContent(contentDir, destDir, platform) {
  await fse.copy(contentDir, destDir, {
    overwrite: false,
    filter: (src) => {
      const rel = path.relative(contentDir, src)
      const parts = rel.split(path.sep)
      if (parts.some(part => ALWAYS_EXCLUDE.some(pattern => part.includes(pattern)))) return false
      if (OPENSPEC_APPLY_FILES.some(f => rel === f)) return false
      return true
    },
  })
}

/**
 * Scan a directory for known AI config files.
 * Returns array of absolute paths found.
 */
const AI_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'ARCHITECTURE.md',
  'DESIGN.md',
  '.cursorrules',
  '.clinerules',
  '.windsurfrules',
  '.github/copilot-instructions.md',
  'copilot-instructions.md',
  '.aider.conf.yml',
  '.aider',
  '.opencode',
  '.agents'
]

export async function findAiFiles(dir) {
  const found = []
  for (const file of AI_FILES) {
    const fullPath = path.join(dir, file)
    if (await fse.pathExists(fullPath)) {
      found.push(fullPath)
    }
  }
  return found
}

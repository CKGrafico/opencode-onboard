import fse from 'fs-extra'
import path from 'path'
import { readdir } from 'fs/promises'

// Files/folders excluded from az content when platform is github and vice versa
const PLATFORM_EXCLUDES = {
  github: ['-az.md', 'ob-userstory-az', 'ob-pullrequest-creator-az', 'ob-pullrequest-observer-az'],
  azure: ['-gh.md', 'ob-userstory-gh', 'ob-pullrequest-creator-gh', 'ob-pullrequest-observer-gh'],
}

// Folders never copied (internal bootstrap tooling)
const ALWAYS_EXCLUDE = ['.bootstrap']

/**
 * Copy content/ directory to destination, filtered by platform.
 * @param {string} contentDir - absolute path to content/
 * @param {string} destDir - absolute path to destination (project root)
 * @param {'azure'|'github'} platform
 */
export async function copyContent(contentDir, destDir, platform) {
  const excludePatterns = [...ALWAYS_EXCLUDE, ...PLATFORM_EXCLUDES[platform]]

  await fse.copy(contentDir, destDir, {
    overwrite: false,
    filter: (src) => {
      const rel = path.relative(contentDir, src)
      // Check if any exclude pattern matches any segment of the path
      const parts = rel.split(path.sep)
      return !parts.some(part =>
        excludePatterns.some(pattern => part.includes(pattern))
      )
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
  '.cursorrules',
  '.clinerules',
  '.windsurfrules',
  '.github/copilot-instructions.md',
  'copilot-instructions.md',
  '.aider.conf.yml',
  '.aider',
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

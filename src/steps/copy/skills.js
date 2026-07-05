import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_SKILLS_DIR = path.resolve(__dirname, '../../../content/.agents/skills')
const CONTENT_SKILLS_LOCK = path.resolve(__dirname, '../../../content/skills-lock.json')

// Userstory skills parse backlog work items → selected by backlogPlatform only.
// Pullrequest skills ship to the repo host → selected by repoPlatform only.
// Mixing the two axes here installs the wrong variant on mixed setups, because
// all variants rename to the same generic dir and the first copy wins.
const USERSTORY_SKILLS = {
  'ob-userstory-gh': 'github',
  'ob-userstory-az': 'azure',
  'ob-userstory-jira': 'jira',
  'ob-userstory-browser': 'browser',
}
const PULLREQUEST_SKILLS = {
  'ob-pullrequest-gh': 'github',
  'ob-pullrequest-az': 'azure',
  'ob-pullrequest-gl': 'gitlab',
}

// Platform-specific skills are renamed to their generic form on install.
// The -gh / -az / -jira / -gl / -browser suffix is only needed here to keep all variants in source.
// After install only one platform is present so no suffix is needed.
const SKILL_RENAME = {
  'ob-userstory-gh':      'ob-userstory',
  'ob-userstory-az':      'ob-userstory',
  'ob-userstory-jira':    'ob-userstory',
  'ob-userstory-browser': 'ob-userstory',
  'ob-pullrequest-gh':    'ob-pullrequest',
  'ob-pullrequest-az':    'ob-pullrequest',
  'ob-pullrequest-gl':    'ob-pullrequest',
}

function shouldInstallSkill(skill, backlogPlatform, repoPlatform) {
  if (skill in USERSTORY_SKILLS) return USERSTORY_SKILLS[skill] === backlogPlatform
  if (skill in PULLREQUEST_SKILLS) return PULLREQUEST_SKILLS[skill] === repoPlatform
  return true
}

async function installObSkills(backlogPlatform = 'github', repoPlatform) {
  const repo = repoPlatform ?? backlogPlatform
  const destSkillsDir = path.join(process.cwd(), '.agents', 'skills')
  await fse.ensureDir(destSkillsDir)

  const skills = await fse.readdir(CONTENT_SKILLS_DIR)
  for (const skill of skills) {
    const src = path.join(CONTENT_SKILLS_DIR, skill)
    const destName = SKILL_RENAME[skill] ?? skill
    const dest = path.join(destSkillsDir, destName)
    const stat = await fse.stat(src)
    if (!stat.isDirectory()) continue
    if (!shouldInstallSkill(skill, backlogPlatform, repo)) {
      info(`Skipping skill: ${skill} (not needed for platforms: ${backlogPlatform}/${repo})`)
      continue
    }
    if (await fse.pathExists(dest)) {
      info(`${destName} already exists, skipping`)
      continue
    }
    await fse.copy(src, dest)
    success(`Installed skill: ${destName}`)
  }
}

export async function installSkills(backlogPlatform = 'github', repoPlatform) {
  info('Installing built-in ob-skills...')
  await installObSkills(backlogPlatform, repoPlatform)
  console.log()

  if (await fse.pathExists(CONTENT_SKILLS_LOCK)) {
    const destLock = path.join(process.cwd(), 'skills-lock.json')
    if (await fse.pathExists(destLock)) {
      info('skills-lock.json already exists, skipping')
    } else {
      await fse.copy(CONTENT_SKILLS_LOCK, destLock)
      success('Installed skills-lock.json')
    }
  }

  info('Installing npx skills from skills-lock.json...')
  try {
    await execa('npx', ['skills'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      reject: false,
    })
  } catch (err) {
    warn(`npx skills failed: ${err.message}`)
  }
}

import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_SKILLS_DIR = path.resolve(__dirname, '../../../content/.agents/skills')
const CONTENT_SKILLS_LOCK = path.resolve(__dirname, '../../../content/skills-lock.json')

const GITHUB_ONLY_SKILLS = new Set(['ob-userstory-gh', 'ob-pullrequest-gh'])
const AZURE_ONLY_SKILLS  = new Set(['ob-userstory-az', 'ob-pullrequest-az'])
const JIRA_ONLY_SKILLS   = new Set(['ob-userstory-jira'])
const GITLAB_ONLY_SKILLS = new Set(['ob-pullrequest-gl'])
const BROWSER_ONLY_SKILLS = new Set(['ob-userstory-browser'])

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
  if (GITHUB_ONLY_SKILLS.has(skill)) return backlogPlatform === 'github' || repoPlatform === 'github'
  if (AZURE_ONLY_SKILLS.has(skill))  return backlogPlatform === 'azure' || repoPlatform === 'azure'
  if (JIRA_ONLY_SKILLS.has(skill))   return backlogPlatform === 'jira'
  if (GITLAB_ONLY_SKILLS.has(skill)) return repoPlatform === 'gitlab'
  if (BROWSER_ONLY_SKILLS.has(skill)) return backlogPlatform === 'browser'
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

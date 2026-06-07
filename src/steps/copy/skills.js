import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { info, success, warn } from '../../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_SKILLS_DIR = path.resolve(__dirname, '../../../content/.agents/skills')
const CONTENT_SKILLS_LOCK = path.resolve(__dirname, '../../../content/skills-lock.json')

async function installObSkills() {
  const destSkillsDir = path.join(process.cwd(), '.agents', 'skills')
  await fse.ensureDir(destSkillsDir)

  const skills = await fse.readdir(CONTENT_SKILLS_DIR)
  for (const skill of skills) {
    const src = path.join(CONTENT_SKILLS_DIR, skill)
    const dest = path.join(destSkillsDir, skill)
    const stat = await fse.stat(src)
    if (!stat.isDirectory()) continue
    if (await fse.pathExists(dest)) {
      info(`${skill} already exists, skipping`)
      continue
    }
    await fse.copy(src, dest)
    success(`Installed skill: ${skill}`)
  }
}

export async function installSkills() {
  info('Installing built-in ob-skills...')
  await installObSkills()
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

  info('Installing opencode-ensemble skill...')
  try {
    const result = await execa('npx', ['skills@latest', 'add', 'hueyexe/opencode-ensemble', '--skill', 'opencode-ensemble', '-y'], {
      reject: false,
      timeout: 120000,
      stdio: 'inherit',
    })
    if (result.exitCode === 0) {
      success('opencode-ensemble skill installed')
    } else {
      warn('opencode-ensemble install exited with non-zero code')
    }
  } catch (err) {
    warn(`opencode-ensemble install failed: ${err.message}`)
  }
}

import { select } from '@inquirer/prompts'
import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { header, info, success, warn } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_SKILLS_DIR = path.resolve(__dirname, '../../content/.agents/skills')

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

export async function chooseSkillsProvider() {
  header('Step 7, Installing skills')

  // ob-skills are always installed, mandatory
  info('Installing built-in ob-skills...')
  await installObSkills()
  console.log()

  info('Skills provide platform and tech-specific knowledge to your agents.')
  info('Agents detect and load skills automatically, you never need to specify them.')
  info('You can add more skills on top of the built-in ones.')
  console.log()

  const selected = await select({
    message: 'Add additional skills from:',
    choices: [
      {
        name: 'npx skills (vercel-labs/skills)',
        value: 'npx-skills',
        description: 'Install skills from the vercel-labs community skills registry',
      },
      {
        name: 'None, built-in skills are enough',
        value: 'none',
      },
    ],
  })

  if (selected === 'none') {
    return
  }

  if (selected === 'npx-skills') {
    info('Running npx skills...')
    console.log()
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
}

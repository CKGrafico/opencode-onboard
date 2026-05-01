import { select } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { header, info, success, warn } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILLS_PROVIDERS_PATH = path.resolve(__dirname, '../presets/skills-providers.json')
const CONTENT_SKILLS_DIR = path.resolve(__dirname, '../../content/.opencode/skills')

const providers = await fse.readJson(SKILLS_PROVIDERS_PATH)

export async function chooseSkillsProvider() {
  header('Step 5, Choose your skills provider')

  info('Skills provide platform and tech-specific knowledge to your agents.')
  info('Agents detect and load skills automatically, you never need to specify them.')
  console.log()

  const selected = await select({
    message: 'Install skills from:',
    choices: providers.map(p => ({
      name: `${p.label}${p.description ? `\n    ${p.description}` : ''}`,
      value: p.value,
    })),
  })

  if (selected === 'none') {
    warn('No skills installed. Add skills to .opencode/skills/ manually.')
    return null
  }

  if (selected === 'ob-skills') {
    const destSkillsDir = path.join(process.cwd(), '.opencode', 'skills')
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
    return selected
  }

  // Custom provider, future: support npx <package> or git URL
  warn(`Custom provider "${selected}" not yet supported. Add skills to .opencode/skills/ manually.`)
  return null
}

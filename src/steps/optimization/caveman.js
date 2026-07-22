import { addSkillToLock } from './skills-lock.js'
import { header, success, info } from '../../utils/exec.js'

const SKILL_ENTRY = {
  source: 'juliusbrussee/caveman',
  sourceType: 'github',
  skillPath: 'skills/caveman/SKILL.md',
}

export async function installCaveman(options = {}) {
  if (!options.skipHeader) header('Installing caveman')

  info('Adding caveman to skills-lock.json for batch install')
  await addSkillToLock('caveman', SKILL_ENTRY)
  success('caveman queued for installation')
  return { optedIn: true, installed: true }
}

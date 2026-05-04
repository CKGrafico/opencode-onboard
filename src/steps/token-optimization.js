import { checkbox } from '@inquirer/prompts'
import { header, info, loading, success, warn } from '../utils/exec.js'
import { checkRtk } from './check-rtk.js'
import { installQuota } from './install-quota.js'
import { installCaveman } from './install-caveman.js'
import { enableCavemanGuidance } from './enable-caveman-guidance.js'

export async function tokenOptimizationStep(options = {}) {
  header('Step 10, Token optimization tools')

  const defaultSelected = ['rtk', 'quota', 'caveman']
  let selected = defaultSelected

  if (!options.skipPrompt && process.stdin.isTTY) {
    info('Choose which optimization tools to enable (recommended: all).')
    const timeoutMs = 30000
    const choice = await Promise.race([
      checkbox({
        message: 'Enable tools:',
        choices: [
          { name: 'RTK check (recommended)', value: 'rtk', checked: true },
          { name: 'opencode-quota plugin (recommended)', value: 'quota', checked: true },
          { name: 'caveman concise mode (recommended)', value: 'caveman', checked: true },
        ],
      }),
      new Promise(resolve => setTimeout(() => resolve(defaultSelected), timeoutMs)),
    ])
    selected = Array.isArray(choice) ? choice : defaultSelected
  }

  loading('applying token optimization selections...')

  const has = value => selected.includes(value)

  const rtk = has('rtk')
    ? await checkRtk({ skipHeader: true, skipPrompt: true })
    : { optedIn: false, checked: false, available: false }

  const quota = has('quota')
    ? await installQuota({ skipHeader: true, skipPrompt: true })
    : { optedIn: false, installed: false }

  const caveman = has('caveman')
    ? await installCaveman({
      skipHeader: true,
      skipPrompt: true,
      skillsProvider: options.skillsProvider,
    })
    : { optedIn: false, installed: false }

  const cavemanGuidance = has('caveman')
    ? await enableCavemanGuidance(caveman)
    : { enabled: false }

  if (selected.length === 0) warn('No token optimization tools selected')
  else success('Token optimization step completed')

  return { rtk, quota, caveman, cavemanGuidance }
}

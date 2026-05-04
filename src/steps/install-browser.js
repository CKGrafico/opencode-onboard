import { execa } from 'execa'
import { header, info, success, warn, error } from '../utils/exec.js'
import os from 'os'

const AUTO_ANSWERS = [
  { trigger: 'Press Enter when',             response: '' },
  { trigger: 'Choose config location',       response: '2' },
  { trigger: 'Add plugin automatically?',    response: 'y' },
  { trigger: 'Create one?',                  response: 'y' },
  { trigger: 'Add browser-automation skill', response: 'n' },
  { trigger: 'Check broker',                 response: 'n' },
]

export async function installBrowser() {
  header('Step 11, Installing opencode-browser')

  try {
    const child = execa('npx', ['@different-ai/opencode-browser', 'install'], {
      cwd: os.homedir(),
      stdio: ['pipe', 'pipe', 'pipe'],
      reject: false,
    })

    const pendingTriggers = [...AUTO_ANSWERS]
    let show = false

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()

      // Show only the load/pin instructions, hide everything else
      if (text.includes('To load the extension')) show = true
      if (text.includes('Press Enter when'))      show = false

      if (show) process.stdout.write(chunk)

      for (let i = 0; i < pendingTriggers.length; i++) {
        if (text.includes(pendingTriggers[i].trigger)) {
          child.stdin.write(pendingTriggers[i].response + '\n')
          pendingTriggers.splice(i, 1)
          break
        }
      }
    })

    child.stderr.on('data', (chunk) => process.stderr.write(chunk))

    const result = await child

    if (result.exitCode === 0) {
      success('opencode-browser installed')
    } else {
      warn('opencode-browser install exited with non-zero code')
    }
  } catch (err) {
    error(`Failed to install opencode-browser: ${err.message}`)
  }
}

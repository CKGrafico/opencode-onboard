import { execa } from 'execa'
import { header, success, warn, error } from '../utils/exec.js'

const AUTO_ANSWERS = [
  { trigger: 'Install scope', response: 'Project' },
  { trigger: 'Quota UI', response: 'Sidebar' },
  { trigger: 'Provider mode', response: 'Auto-detect' },
  { trigger: 'Quota display style', response: 'Single window' },
  { trigger: 'Percent display (toast/sidebar)', response: 'Used' },
  { trigger: 'Show session input/output tokens', response: 'Yes' },
]

export async function installQuota() {
  header('Step 11, Installing opencode-quota')

  try {
    const child = execa('npx', ['@slkiser/opencode-quota', 'init'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      reject: false,
    })

    const pendingTriggers = [...AUTO_ANSWERS]

    child.stdout.on('data', chunk => {
      const text = chunk.toString()

      for (let i = 0; i < pendingTriggers.length; i++) {
        if (text.includes(pendingTriggers[i].trigger)) {
          child.stdin.write(pendingTriggers[i].response + '\n')
          pendingTriggers.splice(i, 1)
          break
        }
      }
    })

    child.stderr.on('data', chunk => process.stderr.write(chunk))

    const result = await child

    if (result.exitCode === 0) {
      success('opencode-quota configured')
    } else {
      warn('opencode-quota init exited with non-zero code')
    }
  } catch (err) {
    error(`Failed to configure opencode-quota: ${err.message}`)
  }
}

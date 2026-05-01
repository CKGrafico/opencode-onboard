import { execa } from 'execa'
import { createInterface } from 'readline'
import { error, header, success, warn } from '../utils/exec.js'
import os from 'os'

export async function installBrowser() {
  header('Step 7, Installing opencode-browser')

  try {
    const child = execa('npx', ['@different-ai/opencode-browser', 'install'], {
      cwd: os.homedir(),
      stdio: ['pipe', 'pipe', 'pipe'],
      reject: false,
    })

    const AUTO_ANSWERS = [
      { trigger: 'Choose config location', response: '2' },
      { trigger: 'Create one?', response: 'y' },
      { trigger: 'Add browser-automation skill', response: 'n' },
      { trigger: 'Check broker', response: 'n' },
    ]

    let pendingTriggers = [...AUTO_ANSWERS]
    let showOutput = true
    let waitingForUser = false

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()

      if (showOutput) {
        process.stdout.write(chunk)
      }

      if (text.includes('Press Enter when') && !waitingForUser) {
        waitingForUser = true
        const rl = createInterface({ input: process.stdin, output: process.stdout })
        rl.question('', () => {
          rl.close()
          child.stdin.write('\n')
          showOutput = false
        })
        return
      }

      for (let i = 0; i < pendingTriggers.length; i++) {
        if (text.includes(pendingTriggers[i].trigger)) {
          child.stdin.write(pendingTriggers[i].response + '\n')
          pendingTriggers.splice(i, 1)
          break
        }
      }
    })

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

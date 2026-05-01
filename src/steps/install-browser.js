import { execa } from 'execa'
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
      { trigger: 'Choose config location', response: '2' }, // global config
      { trigger: 'Create one?', response: 'y' },
      { trigger: 'Add browser-automation skill', response: 'n' },
      { trigger: 'Check broker', response: 'n' },
    ]

    let pendingTriggers = [...AUTO_ANSWERS]
    let showOutput = true  // show output until after step 3 user interaction
    let waitingForUser = false

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()

      if (showOutput) {
        process.stdout.write(chunk)
      }

      // Step 3 — let user press Enter, then suppress remaining output
      if (text.includes('Press Enter when') && !waitingForUser) {
        waitingForUser = true
        process.stdin.resume()
        process.stdin.once('data', () => {
          child.stdin.write('\n')
          process.stdin.pause()
          showOutput = false  // suppress steps 4-9 output
        })
        return
      }

      // Auto-answer remaining prompts
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

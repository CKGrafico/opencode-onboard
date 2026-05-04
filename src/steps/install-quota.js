import { confirm } from '@inquirer/prompts'
import { execa } from 'execa'
import { header, success, warn, error, loading } from '../utils/exec.js'

const PROMPT_PATTERNS = [
  /Install scope/i,
  /Quota UI/i,
  /Provider mode/i,
  /Quota display style/i,
  /Percent display \(toast\/sidebar\)/i,
  /Show session input\/output tokens/i,
  /Apply these changes\?/i,
]

const ANSI_REGEX = /\x1B\[[0-?]*[ -/]*[@-~]/g

export async function installQuota() {
  header('Step 11, Installing opencode-quota')

  const shouldInstall = await confirm({
    message: 'Install opencode-quota with recommended defaults?',
    default: true,
  })

  if (!shouldInstall) {
    warn('Skipped opencode-quota installation')
    return { optedIn: false, installed: false }
  }

  loading('configuring opencode-quota...')

  try {
    const child = execa('npx', ['@slkiser/opencode-quota', 'init'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      reject: false,
    })

    let textBuffer = ''
    const pending = [...PROMPT_PATTERNS]
    let timedOut = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, 120000)

    const onData = chunk => {
      textBuffer += chunk.toString().replace(ANSI_REGEX, '')
      if (textBuffer.length > 12000) textBuffer = textBuffer.slice(-12000)

      if (pending.length > 0 && pending[0].test(textBuffer)) {
        child.stdin.write('\n')
        pending.shift()
      }
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.stderr.on('data', chunk => process.stderr.write(chunk))

    const result = await child
    clearTimeout(timeout)

    if (timedOut) {
      warn('opencode-quota init timed out after 120s, skipping')
      return { optedIn: true, installed: false }
    }

    if (result.exitCode === 0) {
      success('opencode-quota configured')
      return { optedIn: true, installed: true }
    }

    warn('opencode-quota init exited with non-zero code')
    return { optedIn: true, installed: false }
  } catch (err) {
    error(`Failed to configure opencode-quota: ${err.message}`)
    return { optedIn: true, installed: false }
  }
}

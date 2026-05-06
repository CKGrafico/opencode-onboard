import { execa } from 'execa'
import fse from 'fs-extra'
import { header, info, success, warn, error } from '../../utils/exec.js'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BROWSER_PRESET_PATH = path.resolve(__dirname, '../../presets/browser.json')
const browserPreset = await fse.readJson(BROWSER_PRESET_PATH)

export async function installBrowser() {
  header('Step 9, Installing opencode-browser')

  try {
    const child = execa(browserPreset.installer.command, browserPreset.installer.args, {
      cwd: os.homedir(),
      stdio: ['pipe', 'pipe', 'pipe'],
      reject: false,
    })

    const pendingTriggers = [...browserPreset.autoAnswers]
    let show = false

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()

      if (text.includes(browserPreset.output.showAfter)) show = true
      if (text.includes(browserPreset.output.hideAfter)) show = false

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

import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { createRequire } from 'node:module'
import { header, success, warn } from '../utils/exec.js'

const require = createRequire(import.meta.url)
const { version: onboardVersion } = require('../../package.json')

async function detectOpencodeVersion() {
  try {
    const result = await execa('opencode', ['--version'], { reject: false })
    if (result.exitCode !== 0) return null
    const output = (result.stdout || result.stderr || '').trim()
    return output || null
  } catch {
    return null
  }
}

export async function writeOnboardConfig(data) {
  header('Step 12, Writing onboarding metadata')

  const opencodeVersion = await detectOpencodeVersion()
  const target = path.join(process.cwd(), '.opencode', 'opencode-onboard.json')

  const payload = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    onboardVersion,
    opencodeVersion,
    wizard: {
      platform: data.platform,
      sourceMode: data.sourceMode,
      sourceRoots: data.sourceRoots,
      preserved: {
        design: !!data.hasDesign,
        architecture: !!data.hasArchitecture,
        openspec: !!data.hasOpenspec,
      },
      additionalSkillsProvider: data.additionalSkillsProvider,
      models: {
        plan: data.planModel,
        build: data.buildModel,
        fast: data.fastModel,
      },
    },
    note: 'Informational file only. Editing this file does not change runtime behavior.',
  }

  try {
    await fse.ensureDir(path.dirname(target))
    await fse.writeJson(target, payload, { spaces: 2 })
    success('Wrote .opencode/opencode-onboard.json')
    if (!opencodeVersion) warn('Could not detect opencode version, saved as null')
  } catch (err) {
    warn(`Could not write onboarding metadata: ${err.message}`)
  }
}

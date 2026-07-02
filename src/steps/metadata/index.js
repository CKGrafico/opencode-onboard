import { execa } from 'execa'
import fse from 'fs-extra'
import path from 'path'
import { createRequire } from 'node:module'
import { header, success, warn } from '../../utils/exec.js'

const require = createRequire(import.meta.url)
const { version: onboardVersion } = require('../../../package.json')

function clampConcurrency(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 3
  return Math.min(5, Math.max(1, Math.round(v)))
}

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
  header('Step 10, Writing onboarding metadata')

  const opencodeVersion = await detectOpencodeVersion()
  const cwd = data.cwd ?? process.cwd()
  const target = path.join(cwd, '.opencode', 'opencode-onboard.json')

  // Read the existing file so load-bearing config (models, maxConcurrentAgents)
  // is preserved across metadata refreshes when not explicitly provided.
  const existing = await fse.readJson(target).catch(() => null)
  const existingWizard = existing?.wizard ?? {}

  const selectedModels = Object.fromEntries(
    Object.entries({
      plan: data.planModel,
      build: data.buildModel,
      fast: data.fastModel,
    }).filter(([, value]) => value)
  )
  const models = Object.keys(selectedModels).length > 0 ? selectedModels : existingWizard.models ?? null
  const maxConcurrentAgents = clampConcurrency(data.maxConcurrentAgents ?? existingWizard.maxConcurrentAgents ?? 3)

  const payload = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    onboardVersion,
    opencodeVersion,
    wizard: {
      platform: data.repoPlatform ?? data.platform ?? 'none',
      backlogPlatform: data.backlogPlatform ?? data.platform ?? 'none',
      repoPlatform: data.repoPlatform ?? data.platform ?? 'none',
      sourceMode: data.sourceMode,
      sourceRoots: data.sourceRoots,
      maxConcurrentAgents,
      preserved: {
        design: !!data.hasDesign,
        architecture: !!data.hasArchitecture,
        openspec: !!data.hasOpenspec,
      },
      openspec: data.openspec,
      additionalSkillsProvider: data.additionalSkillsProvider,
      ...(models ? { models } : {}),
      optionalTools: data.optionalTools ?? null,
      cavemanGuidance: data.cavemanGuidance ?? null,
    },
    note:
      'Snapshot of onboarding choices. Runtime config — wizard.models and wizard.maxConcurrentAgents — ' +
      'is read by /ob-apply and the agent generator and is preserved across `opencode-onboard metadata` refreshes. ' +
      'Other fields are informational.',
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

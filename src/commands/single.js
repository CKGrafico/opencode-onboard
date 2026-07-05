import fse from 'fs-extra'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { cleanAiFiles } from '../steps/clean/index.js'
import { copyContentStep } from '../steps/copy/index.js'
import { chooseModels } from '../steps/models/index.js'
import { initOpenspec } from '../steps/openspec/index.js'
import { tokenOptimizationStep } from '../steps/optimization/index.js'
import { choosePlatform } from '../steps/platform/index.js'
import { installBrowser } from '../steps/browser/index.js'
import { writeOnboardConfig } from '../steps/metadata/index.js'
import { readOnboardConfig } from './shared.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const platformsPreset = await fse.readJson(path.resolve(__dirname, '../presets/platforms.json'))
// platforms.json is the single source of truth for valid platform values.
// Hardcoding a subset here silently rewrote jira/gitlab/browser projects to github.
const VALID_PLATFORMS = new Set(platformsPreset.map(p => p.value))

export function resolvePlatform(value, fallback = 'github') {
  return VALID_PLATFORMS.has(value) ? value : fallback
}

export async function runSingleCommand(command) {
  const saved = await readOnboardConfig()
  const savedWizard = saved?.wizard ?? {}
  const ctx = {
    hasDesign: !!savedWizard?.preserved?.design,
    hasArchitecture: !!savedWizard?.preserved?.architecture,
    hasOpenspec: !!savedWizard?.preserved?.openspec,
    sourceMode: savedWizard?.sourceMode ?? 'current',
    sourceRoots: Array.isArray(savedWizard?.sourceRoots) ? savedWizard.sourceRoots : [],
    maxConcurrentAgents: savedWizard?.maxConcurrentAgents ?? 3,
  }
  const backlogPlatform = savedWizard?.backlogPlatform ?? savedWizard?.platform
  const repoPlatform = savedWizard?.repoPlatform ?? savedWizard?.platform
  const resolvedBacklog = resolvePlatform(backlogPlatform)
  const resolvedRepo = resolvePlatform(repoPlatform)

  const handlers = {
    clean: async () => {
      await cleanAiFiles()
    },
    platform: async () => {
      await choosePlatform()
    },
    copy: async () => {
      await copyContentStep({ backlogPlatform: resolvedBacklog, repoPlatform: resolvedRepo }, ctx)
    },
    openspec: async () => {
      await initOpenspec()
    },
    models: async () => {
      await chooseModels()
    },
    optimization: async () => {
      await tokenOptimizationStep({ ctx })
    },
    browser: async () => {
      await installBrowser()
    },
    metadata: async () => {
      await writeOnboardConfig({
        ...ctx,
        backlogPlatform: resolvedBacklog,
        repoPlatform: resolvedRepo,
        maxConcurrentAgents: savedWizard?.maxConcurrentAgents ?? 3,
        additionalSkillsProvider: 'npx-skills',
        planModel: savedWizard?.models?.plan ?? null,
        buildModel: savedWizard?.models?.build ?? null,
        fastModel: savedWizard?.models?.fast ?? null,
        optionalTools: savedWizard?.optionalTools ?? null,
        cavemanGuidance: savedWizard?.cavemanGuidance ?? null,
      })
    },
  }

  const handler = handlers[command]
  if (!handler) return false
  await handler()
  return true
}

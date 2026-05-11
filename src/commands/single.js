import { cleanAiFiles } from '../steps/clean/index.js'
import { copyContentStep } from '../steps/copy/index.js'
import { chooseModels } from '../steps/models/index.js'
import { initOpenspec } from '../steps/openspec/index.js'
import { tokenOptimizationStep } from '../steps/optimization/index.js'
import { choosePlatform } from '../steps/platform/index.js'
import { installBrowser } from '../steps/browser/index.js'
import { writeOnboardConfig } from '../steps/metadata/index.js'
import { readOnboardConfig } from './shared.js'

export async function runSingleCommand(command) {
  const saved = await readOnboardConfig()
  const savedWizard = saved?.wizard ?? {}
  const ctx = {
    hasDesign: !!savedWizard?.preserved?.design,
    hasArchitecture: !!savedWizard?.preserved?.architecture,
    hasOpenspec: !!savedWizard?.preserved?.openspec,
    sourceMode: savedWizard?.sourceMode ?? 'current',
    sourceRoots: Array.isArray(savedWizard?.sourceRoots) ? savedWizard.sourceRoots : [],
    maxConcurrentAgents: savedWizard?.maxConcurrentAgents ?? 4,
  }
  const platform = savedWizard?.platform
  const resolvedPlatform = platform === 'azure' || platform === 'github' ? platform : 'github'

  const handlers = {
    clean: async () => {
      await cleanAiFiles()
    },
    platform: async () => {
      await choosePlatform()
    },
    copy: async () => {
      await copyContentStep(resolvedPlatform, ctx)
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
        platform: resolvedPlatform,
        maxConcurrentAgents: savedWizard?.maxConcurrentAgents ?? 4,
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

import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

/**
 * Writes selected models to ensemble.json (modelsByAgent) and opencode.json (default model).
 * Agent files no longer receive a model: field — models are assigned per task during /opsx-propose
 * and read from opencode-onboard.json wizard.models at spawn time.
 */
export async function writeModelsToConfigs({ planModel, buildModel, fastModel, cwd = process.cwd() }) {
  const opencodeJsonPath = path.join(cwd, '.opencode', 'opencode.json')
  if (await fse.pathExists(opencodeJsonPath)) {
    const config = await fse.readJson(opencodeJsonPath)
    if (buildModel) config.model = buildModel
    else delete config.model
    await fse.writeJson(opencodeJsonPath, config, { spaces: 2 })
    if (buildModel) success(`default model -> ${buildModel} (written to .opencode/opencode.json)`)
  }

  const ensembleJsonPath = path.join(cwd, '.opencode', 'ensemble.json')
  if (await fse.pathExists(ensembleJsonPath)) {
    const ensemble = await fse.readJson(ensembleJsonPath)
    delete ensemble.defaultModel
    const modelsByAgent = { ...ensemble.modelsByAgent }
    if (planModel) modelsByAgent.plan = planModel
    else delete modelsByAgent.plan
    if (buildModel) modelsByAgent.build = buildModel
    else delete modelsByAgent.build
    if (fastModel) modelsByAgent.explore = fastModel
    else delete modelsByAgent.explore

    if (Object.keys(modelsByAgent).length > 0) ensemble.modelsByAgent = modelsByAgent
    else delete ensemble.modelsByAgent

    await fse.writeJson(ensembleJsonPath, ensemble, { spaces: 2 })
    if (planModel) success(`plan model -> ${planModel} (written to .opencode/ensemble.json)`)
    if (buildModel) success(`build model -> ${buildModel} (written to .opencode/ensemble.json)`)
    if (fastModel) success(`fast model -> ${fastModel} (written to .opencode/ensemble.json)`)
  }
}

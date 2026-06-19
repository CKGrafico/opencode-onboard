import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

/**
 * Writes the selected build model as the default model in opencode.json.
 * Per-tier models (plan/build/fast) are recorded in opencode-onboard.json (wizard.models)
 * by the metadata step, then consumed by the agent-variant generator and /ob-apply.
 */
export async function writeModelsToConfigs({ buildModel, cwd = process.cwd() }) {
  const opencodeJsonPath = path.join(cwd, '.opencode', 'opencode.json')
  if (await fse.pathExists(opencodeJsonPath)) {
    const config = await fse.readJson(opencodeJsonPath)
    if (buildModel) config.model = buildModel
    else delete config.model
    await fse.writeJson(opencodeJsonPath, config, { spaces: 2 })
    if (buildModel) success(`default model -> ${buildModel} (written to .opencode/opencode.json)`)
  }
}

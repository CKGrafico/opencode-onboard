import fse from 'fs-extra'
import { applyEdits, modify, parse } from 'jsonc-parser'
import path from 'path'
import { success, warn } from '../../utils/exec.js'

/**
 * Writes the selected build model as the default model in opencode.json.
 * Per-tier models (plan/build/fast) are recorded in opencode-onboard.json (wizard.models)
 * by the metadata step, then consumed by the agent-variant generator and /ob-apply.
 *
 * opencode tolerates JSONC (comments, trailing commas) in its config, so this
 * must not use readJson/writeJson: a strict parse crashes on valid configs and
 * a strict rewrite deletes user comments. jsonc-parser edits only the `model`
 * key and preserves the rest of the file byte-for-byte.
 */
export async function writeModelsToConfigs({ buildModel, cwd = process.cwd() }) {
  const opencodeJsonPath = path.join(cwd, '.opencode', 'opencode.json')
  if (!await fse.pathExists(opencodeJsonPath)) return

  const text = await fse.readFile(opencodeJsonPath, 'utf-8')
  const errors = []
  parse(text, errors)
  if (errors.length > 0) {
    warn('.opencode/opencode.json could not be parsed — leaving it untouched. Set "model" manually.')
    return
  }

  // `undefined` removes the key; a string value sets it.
  const edits = modify(text, ['model'], buildModel || undefined, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  })
  await fse.writeFile(opencodeJsonPath, applyEdits(text, edits), 'utf-8')
  if (buildModel) success(`default model -> ${buildModel} (written to .opencode/opencode.json)`)
}

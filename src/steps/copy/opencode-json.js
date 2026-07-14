import fse from 'fs-extra'
import { applyEdits, modify, parse } from 'jsonc-parser'
import path from 'node:path'
import { success } from '../../utils/exec.js'

export async function patchOpencodeJson(cwd = process.cwd()) {
  const opencodeDir = path.join(cwd, '.opencode')
  const opencodePath = path.join(opencodeDir, 'opencode.json')

  let text
  if (await fse.pathExists(opencodePath)) {
    text = await fse.readFile(opencodePath, 'utf-8')
  } else {
    text = JSON.stringify({ $schema: 'https://opencode.ai/config.json' }, null, 2)
  }

  const errors = []
  const parsed = parse(text, errors)
  if (errors.length > 0 || typeof parsed !== 'object') {
    return { patched: false, reason: 'parse error' }
  }

  const alreadyDisabled =
    parsed?.agent?.build?.disable === true &&
    parsed?.agent?.plan?.disable === true

  if (alreadyDisabled) {
    return { patched: false }
  }

  // Apply edits sequentially so offsets stay correct
  const edits1 = modify(text, ['agent', 'build', 'disable'], true, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  })
  const text2 = applyEdits(text, edits1)

  const edits2 = modify(text2, ['agent', 'plan', 'disable'], true, {
    formattingOptions: { insertSpaces: true, tabSize: 2 },
  })
  const text3 = applyEdits(text2, edits2)

  await fse.ensureDir(opencodeDir)
  await fse.writeFile(opencodePath, text3, 'utf-8')
  success('Disabled built-in build/plan agents in .opencode/opencode.json')

  return { patched: true }
}

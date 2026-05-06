import fse from 'fs-extra'
import path from 'path'
import { info, success } from '../../utils/exec.js'

const STEP1_HEADING = '### Step 1, Archive project history into OpenSpec'
const STEP2_HEADING = '### Step 2, Generate DESIGN.md'
const STEP3_HEADING = '### Step 3, Generate ARCHITECTURE.md'

const STEP1_CONFIRM_LINE = '- Project history archived in openspec'
const STEP2_CONFIRM_LINE = '- DESIGN.md generated'
const STEP3_CONFIRM_LINE = '- ARCHITECTURE.md generated'

function removeStepBlock(content, heading) {
  const lines = content.split('\n')
  const start = lines.findIndex(l => l.trim() === heading.trim())
  if (start === -1) return content

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break }
  }

  if (end === -1) return content

  const removeFrom = start > 0 && lines[start - 1].trim() === '' ? start - 1 : start
  lines.splice(removeFrom, end - removeFrom + 1)
  return lines.join('\n')
}

function removeConfirmLine(content, line) {
  return content.split('\n').filter(l => l.trim() !== line.trim()).join('\n')
}

function renumberSteps(content) {
  let counter = 0
  return content.replace(/^### Step \d+,/gm, () => `### Step ${++counter},`)
}

export async function patchAgentsMd(ctx) {
  const agentsMdPath = path.join(process.cwd(), 'AGENTS.md')
  if (!await fse.pathExists(agentsMdPath)) return

  let content = await fse.readFile(agentsMdPath, 'utf-8')
  const patches = []

  if (ctx.hasOpenspec) {
    content = removeStepBlock(content, STEP1_HEADING)
    content = removeConfirmLine(content, STEP1_CONFIRM_LINE)
    patches.push('Step 1 (openspec history) removed, openspec/ already exists')
  }

  if (ctx.hasDesign) {
    content = removeStepBlock(content, STEP2_HEADING)
    content = removeConfirmLine(content, STEP2_CONFIRM_LINE)
    patches.push('Step 2 (DESIGN.md) removed, DESIGN.md already exists')
  }

  if (ctx.hasArchitecture) {
    content = removeStepBlock(content, STEP3_HEADING)
    content = removeConfirmLine(content, STEP3_CONFIRM_LINE)
    patches.push('Step 3 (ARCHITECTURE.md) removed, ARCHITECTURE.md already exists')
  }

  if (patches.length > 0) {
    content = renumberSteps(content)
    await fse.writeFile(agentsMdPath, content, 'utf-8')
    for (const msg of patches) info(msg)
    success('AGENTS.md patched for existing project state')
  }
}

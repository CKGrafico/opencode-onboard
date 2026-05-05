import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { copyContent } from '../utils/copy.js'
import { error, header, success } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../../content')

function formatRootsForText(roots = [], cwd = process.cwd()) {
  if (!roots.length) return ['current folder']
  return roots.map(r => {
    const rel = path.relative(cwd, r)
    if (!rel || rel === '') return 'current folder'
    if (!rel.startsWith('..')) return rel
    return rel.replace(/\\/g, '/')
  })
}

async function patchSourceScopeFiles(dest, ctx) {
  const roots = formatRootsForText(ctx.sourceRoots || [dest], dest)
  const rootsInline = roots.join(', ')
  const rootsBullets = roots.map(r => `  - ${r}`).join('\n')

  const agentsPath = path.join(dest, 'AGENTS.md')
  if (await fse.pathExists(agentsPath)) {
    let content = await fse.readFile(agentsPath, 'utf-8')
    content = content.replace(
      'Before scanning, load source roots from `.agents/source-roots.json` when present. Only scan those roots plus this repo\'s docs/config files.',
      `Source roots selected during onboarding (scan these roots plus this repo docs/config): ${rootsInline}.`
    )
    content = content.replace(
      '4. **Analyze the actual codebase**: use `.agents/source-roots.json` as source roots when present, then read CSS files, Tailwind config, component files, token definitions. Do not rely on prior knowledge, read the files.',
      `4. **Analyze the actual codebase** using these source roots:\n${rootsBullets}\n\n   Then read CSS files, Tailwind config, component files, token definitions. Do not rely on prior knowledge, read the files.`
    )
    content = content.replace(
      '4. **Analyze the actual codebase**: use `.agents/source-roots.json` as source roots when present, then read folder structure, config files, route definitions, data models, integration points. Do not rely on prior knowledge, read the files.',
      `4. **Analyze the actual codebase** using these source roots:\n${rootsBullets}\n\n   Then read folder structure, config files, route definitions, data models, integration points. Do not rely on prior knowledge, read the files.`
    )
    content = content.replace(
      '- Read source scope from `.agents/source-roots.json`.',
      `- Source roots selected during onboarding: ${rootsInline}.`
    )
    await fse.writeFile(agentsPath, content, 'utf-8')
  }

  const designPath = path.join(dest, 'DESIGN.md')
  if (await fse.pathExists(designPath)) {
    let content = await fse.readFile(designPath, 'utf-8')
    const injection = `\nSource roots selected during onboarding:\n${rootsBullets}\n\nWhen analyzing, read UI/design evidence only from these roots.\n\nIn the generated DESIGN.md, add this section near the top:\n\n## Source Roots Used\n${rootsBullets}\n`
    content = content.replace(
      'Analyze the design system of this codebase with the goal of creating a DESIGN.md file in the project root and giving the user a file for easy copy & pasting.',
      'Analyze the design system of this codebase with the goal of creating a DESIGN.md file in the project root and giving the user a file for easy copy & pasting.' + injection
    )
    await fse.writeFile(designPath, content, 'utf-8')
  }

  const architecturePath = path.join(dest, 'ARCHITECTURE.md')
  if (await fse.pathExists(architecturePath)) {
    let content = await fse.readFile(architecturePath, 'utf-8')
    const injection = `\nSource roots selected during onboarding:\n${rootsBullets}\n\nWhen analyzing, read architecture evidence only from these roots.\n\nIn the generated ARCHITECTURE.md, add this section near the top:\n\n## Source Roots Used\n${rootsBullets}\n`
    content = content.replace(
      'Analyze the architecture of this codebase with the goal of creating an ARCHITECTURE.md file in the project root and giving the user a file for easy copy & pasting.',
      'Analyze the architecture of this codebase with the goal of creating an ARCHITECTURE.md file in the project root and giving the user a file for easy copy & pasting.' + injection
    )
    await fse.writeFile(architecturePath, content, 'utf-8')
  }
}

export async function copyContentStep(platform, ctx = {}) {
  header('Step 6, Copying opencode-onboard files')

  const dest = process.cwd()

  try {
    await copyContent(CONTENT_DIR, dest, platform, ctx)
    const rootsFile = path.join(dest, '.agents', 'source-roots.json')
    await fse.ensureDir(path.dirname(rootsFile))
    await fse.writeJson(rootsFile, {
      mode: ctx.sourceMode || 'current',
      roots: ctx.sourceRoots || [dest],
    }, { spaces: 2 })
    await patchSourceScopeFiles(dest, ctx)
    success('Files copied to project root')
  } catch (err) {
    error(`Failed to copy content: ${err.message}`)
    process.exit(1)
  }
}

import chalk from 'chalk'
import { chooseSourceScope } from '../steps/source/index.js'
import { cleanAiFiles } from '../steps/clean/index.js'
import { choosePlatform } from '../steps/platform/index.js'
import { copyContentStep } from '../steps/copy/index.js'
import { initOpenspec } from '../steps/openspec/index.js'
import { chooseModels } from '../steps/models/index.js'
import { tokenOptimizationStep } from '../steps/optimization/index.js'
import { installBrowser } from '../steps/browser/index.js'
import { writeOnboardConfig } from '../steps/metadata/index.js'

export async function runWizard(version) {
  const logo = chalk.hex('#fe3d57')
  const bannerLines = [
    logo('                             '),
    logo('        ▒▒▒▒▒▒▒▒▒▒▒▒▒        '),
    logo('        ▒▒▓       ▓▒▓        '),
    logo('   ▒▒▒▒▒▒▓▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒   '),
    logo('  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓  '),
    logo(' ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓ '),
    logo(' ▓▒▒▒▒░░░▒▒▒▒▒▒▒▒▒▒▒░░░▒▒▒▓▓ '),
    logo('  ▓▓▓▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒▓▓▓▓  '),
    logo('  ▓▓▒▒▒▒▒▒░▒▒▒▒▒▒▒░▒▒▒▒▒▒▓▓  '),
    logo('  ▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓   '),
    logo('  ▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓   '),
    logo('   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    '),
    '',
    chalk.bold('        🧰 opencode-onboard') + chalk.dim(` v${version}`),
    chalk.dim('        Prepare your codebase for AI agents'),
  ]

  for (const line of bannerLines) console.log(line)
  console.log()
  console.log('  This tool will set up your project with a team of AI agents,')
  console.log('  install skills, select models, and configure OpenCode.')
  console.log()

  // Only wait for Enter in a real interactive TTY
  if (process.stdin.isTTY) {
    console.log(chalk.bold('  Press Enter to begin...'))
    console.log()
    await new Promise(resolve => {
      process.stdin.resume()
      process.stdin.once('data', () => {
        process.stdin.pause()
        resolve()
      })
    })
  }

  const scope = await chooseSourceScope()

  const preserve = await cleanAiFiles()
  const ctx = { ...preserve, ...scope }

  const platform = await choosePlatform()

  await copyContentStep(platform, ctx)

  await initOpenspec()

  const selectedModels = await chooseModels()

  const tokenOpt = await tokenOptimizationStep({ ctx })
  const { rtk, quota, caveman, cavemanGuidance } = tokenOpt

  await installBrowser()

  await writeOnboardConfig({
    ...ctx,
    platform,
    additionalSkillsProvider: 'npx-skills',
    ...selectedModels,
    optionalTools: { rtk, quota, caveman },
    cavemanGuidance,
  })

  const toGenerate = [
    !ctx.hasDesign && 'DESIGN.md',
    !ctx.hasArchitecture && 'ARCHITECTURE.md',
  ].filter(Boolean)

  console.log()
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(chalk.bold.green('  Onboarding complete!'))
  console.log(chalk.bold.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log()
  console.log('  Open this project in OpenCode and type:')
  console.log(chalk.bold('  "init"'))
  console.log()
  if (toGenerate.length > 0) {
    console.log(`  OpenCode will generate ${toGenerate.join(' and ')}`)
    console.log('  from your actual codebase, then activate the agent team.')
  } else {
    console.log('  OpenCode will activate the agent team.')
  }
  console.log(`  Source scope: ${ctx.sourceMode === 'parent-selected' ? ctx.sourceRoots.map(p => `../${p.split(/[/\\]/).pop()}`).join(', ') : 'current folder'}`)
  console.log()
}

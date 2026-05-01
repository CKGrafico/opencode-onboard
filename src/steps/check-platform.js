import { commandExists, header, success, warn, info, code } from '../utils/exec.js'
import { execa } from 'execa'

export async function checkPlatform(platform) {
  if (platform === 'azure') {
    await checkAzure()
  } else {
    await checkGithub()
  }
}

async function checkAzure() {
  header('Step 9 — Checking Azure DevOps CLI')

  // Check az is installed
  const hasAz = await commandExists('az')
  if (!hasAz) {
    warn('Azure CLI (az) not found.')
    info('Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli')
    return
  }
  success('Azure CLI (az) available')

  // Check az devops extension
  try {
    const result = await execa('az', ['extension', 'list', '--query', "[?name=='azure-devops']", '-o', 'tsv'], {
      reject: false,
    })
    const hasExtension = result.stdout && result.stdout.includes('azure-devops')

    if (hasExtension) {
      success('azure-devops extension installed')
    } else {
      warn('azure-devops extension not found. Run:')
      code([
        'az extension add --name azure-devops',
        'az config set extension.dynamic_install_allow_preview=true',
        'az login',
        'az devops login --organization https://dev.azure.com/<your-org>',
      ])
    }
  } catch {
    warn('Could not check azure-devops extension. Run:')
    code([
      'az extension add --name azure-devops',
      'az config set extension.dynamic_install_allow_preview=true',
      'az login',
      'az devops login --organization https://dev.azure.com/<your-org>',
    ])
  }
}

async function checkGithub() {
  header('Step 9 — Checking GitHub CLI')

  const hasGh = await commandExists('gh')

  if (hasGh) {
    success('GitHub CLI (gh) available')

    // Check auth status
    try {
      const result = await execa('gh', ['auth', 'status'], { reject: false })
      if (result.exitCode === 0) {
        success('GitHub CLI authenticated')
      } else {
        warn('GitHub CLI not authenticated. Run:')
        code(['gh auth login'])
      }
    } catch {
      warn('Could not check gh auth status.')
    }
  } else {
    warn('GitHub CLI (gh) not found.')
    info('Install from: https://cli.github.com')
    console.log()
    info('After installing, authenticate with:')
    code(['gh auth login'])
  }
}

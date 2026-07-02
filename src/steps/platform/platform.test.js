import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  code: vi.fn(),
  commandExists: vi.fn(),
  header: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

import { select } from '@inquirer/prompts'
import { execa } from 'execa'
import { commandExists, success, warn } from '../../utils/exec.js'
import { checkPlatform, choosePlatform } from './index.js'

describe('choosePlatform()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns both platforms as github when user selects GitHub for both', async () => {
    select.mockResolvedValueOnce('github').mockResolvedValueOnce('github')

    const result = await choosePlatform()

    expect(result).toEqual({ backlogPlatform: 'github', repoPlatform: 'github' })
    expect(success).toHaveBeenCalledWith('Backlog platform: GitHub')
    expect(success).toHaveBeenCalledWith('Repo platform: GitHub')
  })

  it('returns both platforms as azure when user selects Azure DevOps for both', async () => {
    select.mockResolvedValueOnce('azure').mockResolvedValueOnce('azure')

    const result = await choosePlatform()

    expect(result).toEqual({ backlogPlatform: 'azure', repoPlatform: 'azure' })
    expect(success).toHaveBeenCalledWith('Backlog platform: Azure DevOps')
    expect(success).toHaveBeenCalledWith('Repo platform: Azure DevOps')
  })

  it('returns mixed azure backlog + github repo', async () => {
    select.mockResolvedValueOnce('azure').mockResolvedValueOnce('github')

    const result = await choosePlatform()

    expect(result).toEqual({ backlogPlatform: 'azure', repoPlatform: 'github' })
  })

  it('skips repo question when backlog is none', async () => {
    select.mockResolvedValueOnce('none')

    const result = await choosePlatform()

    expect(result).toEqual({ backlogPlatform: 'none', repoPlatform: 'none' })
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('returns jira backlog + github repo', async () => {
    select.mockResolvedValueOnce('jira').mockResolvedValueOnce('github')

    const result = await choosePlatform()

    expect(result).toEqual({ backlogPlatform: 'jira', repoPlatform: 'github' })
    expect(success).toHaveBeenCalledWith('Backlog platform: Jira (Atlassian)')
    expect(success).toHaveBeenCalledWith('Repo platform: GitHub')
  })

  it('excludes jira from repo platform choices', async () => {
    select.mockResolvedValueOnce('jira').mockResolvedValueOnce('github')

    await choosePlatform()

    // Second select call should not include jira in choices
    const secondCall = select.mock.calls[1][0]
    const choiceValues = secondCall.choices.map(c => c.value)
    expect(choiceValues).not.toContain('jira')
    expect(choiceValues).toContain('github')
    expect(choiceValues).toContain('azure')
    expect(choiceValues).toContain('none')
  })

  describe('checkPlatform()', () => {
    describe('github path', () => {
      it('prints success when gh is installed and authenticated', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 0, stdout: '' })

        await checkPlatform('github')

        expect(success).toHaveBeenCalledWith('GitHub CLI (gh) available')
        expect(success).toHaveBeenCalledWith('GitHub CLI (gh) authenticated')
      })

      it('warns when gh is installed but not authenticated', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 1, stdout: '' })

        await checkPlatform('github')

        expect(success).toHaveBeenCalledWith('GitHub CLI (gh) available')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('not authenticated'))
      })

      it('warns when gh is not installed', async () => {
        commandExists.mockResolvedValue(false)

        await checkPlatform('github')

        expect(warn).toHaveBeenCalledWith('GitHub CLI (gh) not found.')
        expect(success).not.toHaveBeenCalled()
      })

      it('warns when gh auth status check throws', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockRejectedValue(new Error('spawn error'))

        await checkPlatform('github')

        expect(warn).toHaveBeenCalledWith('Could not check gh auth status.')
      })
    })

    describe('azure path', () => {
      it('prints success when az is installed and azure-devops extension present', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 0, stdout: 'azure-devops\tsome info' })

        await checkPlatform('azure')

        expect(success).toHaveBeenCalledWith('Azure CLI (az) available')
        expect(success).toHaveBeenCalledWith('azure-devops extension installed')
      })

      it('warns when az is installed but azure-devops extension is missing', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 0, stdout: '' })

        await checkPlatform('azure')

        expect(success).toHaveBeenCalledWith('Azure CLI (az) available')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('azure-devops extension not found'))
      })

      it('warns when az is not installed', async () => {
        commandExists.mockResolvedValue(false)

        await checkPlatform('azure')

        expect(warn).toHaveBeenCalledWith('Azure CLI (az) not found.')
        expect(success).not.toHaveBeenCalled()
      })

      it('warns when extension check throws', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockRejectedValue(new Error('spawn error'))

        await checkPlatform('azure')

        expect(warn).toHaveBeenCalledWith('Could not check azure-devops extension. Run:')
      })
    })

    describe('none path', () => {
      it('skips CLI checks when no platform integration is selected', async () => {
        await checkPlatform('none')

        expect(commandExists).not.toHaveBeenCalled()
        expect(execa).not.toHaveBeenCalled()
        expect(success).toHaveBeenCalledWith('Platform: None')
      })
    })

    describe('jira path', () => {
      it('prints success when acli is installed and authenticated', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 0, stdout: '' })

        await checkPlatform('jira')

        expect(success).toHaveBeenCalledWith('Atlassian CLI (acli) available')
        expect(success).toHaveBeenCalledWith('Atlassian CLI (acli) authenticated')
      })

      it('warns when acli is installed but not authenticated', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 1, stdout: '' })

        await checkPlatform('jira')

        expect(success).toHaveBeenCalledWith('Atlassian CLI (acli) available')
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('not authenticated'))
      })

      it('warns when acli is not installed', async () => {
        commandExists.mockResolvedValue(false)

        await checkPlatform('jira')

        expect(warn).toHaveBeenCalledWith('Atlassian CLI (acli) not found.')
      })
    })
  })
})

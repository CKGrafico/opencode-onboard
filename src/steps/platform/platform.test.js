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

  it('returns "github" when user selects GitHub', async () => {
    select.mockResolvedValue('github')

    const result = await choosePlatform()

    expect(result).toBe('github')
    expect(success).toHaveBeenCalledWith('Platform: GitHub')
  })

  it('returns "azure" when user selects Azure DevOps', async () => {
    select.mockResolvedValue('azure')

    const result = await choosePlatform()

    expect(result).toBe('azure')
    expect(success).toHaveBeenCalledWith('Platform: Azure DevOps')
  })

  describe('checkPlatform()', () => {
    describe('github path', () => {
      it('prints success when gh is installed and authenticated', async () => {
        commandExists.mockResolvedValue(true)
        execa.mockResolvedValue({ exitCode: 0, stdout: '' })

        await checkPlatform('github')

        expect(success).toHaveBeenCalledWith('GitHub CLI (gh) available')
        expect(success).toHaveBeenCalledWith('GitHub CLI authenticated')
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
  })
})

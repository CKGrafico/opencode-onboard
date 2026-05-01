import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))

import { select } from '@inquirer/prompts'
import { success } from '../../utils/exec.js'
import { choosePlatform } from '../choose-platform.js'

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
})

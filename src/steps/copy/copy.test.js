import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('../../utils/copy.js', () => ({
  copyContent: vi.fn(),
}))

import { copyContent } from '../../utils/copy.js'
import { success, error } from '../../utils/exec.js'
import { copyContentStep } from './index.js'

describe('copyContentStep()', () => {
  const originalExit = process.exit

  beforeEach(() => {
    process.exit = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.exit = originalExit
  })

  it('calls copyContent with the correct platform and prints success', async () => {
    copyContent.mockResolvedValue(undefined)

    await copyContentStep('github')

    expect(copyContent).toHaveBeenCalledWith(
      expect.stringContaining('content'),
      process.cwd(),
      'github',
      {}
    )
    expect(success).toHaveBeenCalledWith('Files copied to project root')
  })

  it('calls copyContent with azure platform', async () => {
    copyContent.mockResolvedValue(undefined)

    await copyContentStep('azure')

    expect(copyContent).toHaveBeenCalledWith(
      expect.stringContaining('content'),
      process.cwd(),
      'azure',
      {}
    )
  })

  it('calls process.exit(1) when copyContent throws', async () => {
    copyContent.mockRejectedValue(new Error('disk full'))

    await copyContentStep('github')

    expect(error).toHaveBeenCalledWith(expect.stringContaining('disk full'))
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})

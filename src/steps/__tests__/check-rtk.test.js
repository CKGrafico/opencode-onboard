import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  commandExists: vi.fn(),
  header: vi.fn(),
  loading: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  code: vi.fn(),
}))

import { commandExists, success, warn } from '../../utils/exec.js'
import { checkRtk } from '../check-rtk.js'

describe('checkRtk()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prints success when rtk is available', async () => {
    commandExists.mockResolvedValue(true)

    await checkRtk({ skipPrompt: true })

    expect(success).toHaveBeenCalledWith('rtk is available')
    expect(warn).not.toHaveBeenCalled()
  })

  it('prints warning with install instructions when rtk is not found', async () => {
    commandExists.mockResolvedValue(false)

    await checkRtk({ skipPrompt: true })

    expect(warn).toHaveBeenCalledWith('rtk not found on PATH.')
    expect(success).not.toHaveBeenCalled()
  })
})

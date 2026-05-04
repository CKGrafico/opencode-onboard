import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
}))

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../check-rtk.js', () => ({
  checkRtk: vi.fn(),
}))

vi.mock('../install-quota.js', () => ({
  installQuota: vi.fn(),
}))

vi.mock('../install-caveman.js', () => ({
  installCaveman: vi.fn(),
}))

vi.mock('../enable-caveman-guidance.js', () => ({
  enableCavemanGuidance: vi.fn(),
}))

import { checkbox } from '@inquirer/prompts'
import { warn } from '../../utils/exec.js'
import { checkRtk } from '../check-rtk.js'
import { installQuota } from '../install-quota.js'
import { installCaveman } from '../install-caveman.js'
import { enableCavemanGuidance } from '../enable-caveman-guidance.js'
import { tokenOptimizationStep } from '../token-optimization.js'

describe('tokenOptimizationStep()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs all optimizations by default selection', async () => {
    checkbox.mockResolvedValue(['rtk', 'quota', 'caveman'])
    checkRtk.mockResolvedValue({ optedIn: true, checked: true, available: true })
    installQuota.mockResolvedValue({ optedIn: true, installed: true })
    installCaveman.mockResolvedValue({ optedIn: true, installed: true })
    enableCavemanGuidance.mockResolvedValue({ enabled: true })

    const result = await tokenOptimizationStep()

    expect(checkRtk).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(installQuota).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(installCaveman).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(enableCavemanGuidance).toHaveBeenCalledWith({ optedIn: true, installed: true })
    expect(result.rtk.available).toBe(true)
    expect(result.quota.installed).toBe(true)
    expect(result.caveman.installed).toBe(true)
    expect(result.cavemanGuidance.enabled).toBe(true)
  })

  it('skips all tools when nothing is selected', async () => {
    checkbox.mockResolvedValue([])

    const result = await tokenOptimizationStep()

    expect(checkRtk).not.toHaveBeenCalled()
    expect(installQuota).not.toHaveBeenCalled()
    expect(installCaveman).not.toHaveBeenCalled()
    expect(enableCavemanGuidance).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('No token optimization tools selected')
    expect(result.rtk.optedIn).toBe(false)
    expect(result.quota.optedIn).toBe(false)
    expect(result.caveman.optedIn).toBe(false)
    expect(result.cavemanGuidance.enabled).toBe(false)
  })
})

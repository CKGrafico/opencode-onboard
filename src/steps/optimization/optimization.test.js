import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  confirm: vi.fn(),
}))

vi.mock('../../utils/exec.js', () => ({
  code: vi.fn(),
  commandExists: vi.fn(),
  header: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('./quota.js', () => ({ installQuota: vi.fn() }))
vi.mock('./caveman.js', () => ({ installCaveman: vi.fn() }))
vi.mock('./caveman-guidance.js', () => ({ enableCavemanGuidance: vi.fn() }))
vi.mock('./global.js', () => ({ configureObGlobal: vi.fn() }))

import { checkbox } from '@inquirer/prompts'
import { commandExists, warn } from '../../utils/exec.js'
import { installQuota } from './quota.js'
import { installCaveman } from './caveman.js'
import { enableCavemanGuidance } from './caveman-guidance.js'
import { configureObGlobal } from './global.js'
import { tokenOptimizationStep } from './index.js'

describe('tokenOptimizationStep()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs all optimizations by default selection', async () => {
    checkbox.mockResolvedValue(['rtk', 'quota', 'caveman'])
    commandExists.mockResolvedValue(true)
    installQuota.mockResolvedValue({ optedIn: true, installed: true })
    installCaveman.mockResolvedValue({ optedIn: true, installed: true })
    enableCavemanGuidance.mockResolvedValue({ enabled: true })
    configureObGlobal.mockResolvedValue({ configured: true })

    const result = await tokenOptimizationStep()

    expect(commandExists).toHaveBeenCalledWith('rtk')
    expect(installQuota).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(installCaveman).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(enableCavemanGuidance).toHaveBeenCalledWith({ optedIn: true, installed: true })
    expect(configureObGlobal).toHaveBeenCalled()
    expect(result.rtk.available).toBe(true)
    expect(result.quota.installed).toBe(true)
    expect(result.caveman.installed).toBe(true)
    expect(result.cavemanGuidance.enabled).toBe(true)
  })

  it('skips all tools when nothing is selected', async () => {
    checkbox.mockResolvedValue([])

    const result = await tokenOptimizationStep()

    expect(commandExists).not.toHaveBeenCalled()
    expect(installQuota).not.toHaveBeenCalled()
    expect(installCaveman).not.toHaveBeenCalled()
    expect(enableCavemanGuidance).not.toHaveBeenCalled()
    expect(configureObGlobal).toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('No token optimization tools selected')
    expect(result.rtk.optedIn).toBe(false)
    expect(result.quota.optedIn).toBe(false)
    expect(result.caveman.optedIn).toBe(false)
    expect(result.cavemanGuidance.enabled).toBe(false)
  })
})

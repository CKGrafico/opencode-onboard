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
vi.mock('./codegraph.js', () => ({ installCodegraph: vi.fn() }))
vi.mock('./memory.js', () => ({ installMemory: vi.fn() }))
vi.mock('./caveman-guidance.js', () => ({ enableCavemanGuidance: vi.fn() }))
vi.mock('./global.js', () => ({ configureAgentsMd: vi.fn() }))

vi.mock('fs-extra', () => ({
  default: {
    readJson: vi.fn().mockResolvedValue({
      info: 'Token optimization info',
      message: 'Select tools',
      timeoutMs: 5000,
      choices: [
        { value: 'rtk', checked: false },
        { value: 'quota', checked: false },
        { value: 'caveman', checked: false },
        { value: 'codegraph', checked: false },
        { value: 'memory', checked: false },
      ],
      guidance: {},
    }),
  },
}))

import { checkbox } from '@inquirer/prompts'
import { commandExists, warn } from '../../utils/exec.js'
import { installQuota } from './quota.js'
import { installCaveman } from './caveman.js'
import { installCodegraph } from './codegraph.js'
import { enableCavemanGuidance } from './caveman-guidance.js'
import { configureAgentsMd } from './global.js'
import { tokenOptimizationStep } from './index.js'

const checkboxMock = vi.mocked(checkbox)
const commandExistsMock = vi.mocked(commandExists)
const installQuotaMock = vi.mocked(installQuota)
const installCavemanMock = vi.mocked(installCaveman)
const installCodegraphMock = vi.mocked(installCodegraph)
const enableCavemanGuidanceMock = vi.mocked(enableCavemanGuidance)
const configureAgentsMdMock = vi.mocked(configureAgentsMd)

describe('tokenOptimizationStep()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs all optimizations by default selection', async () => {
    const originalIsTTY = process.stdin.isTTY
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })

    checkboxMock.mockResolvedValue(['rtk', 'quota', 'caveman', 'codegraph'])
    commandExistsMock.mockResolvedValue(true)
    installQuotaMock.mockResolvedValue({ optedIn: true, installed: true })
    installCavemanMock.mockResolvedValue({ optedIn: true, installed: true })
    installCodegraphMock.mockResolvedValue({ optedIn: true, installed: true })
    enableCavemanGuidanceMock.mockResolvedValue({ enabled: true })
    configureAgentsMdMock.mockResolvedValue({ configured: true })

    const result = await tokenOptimizationStep()

    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })

    expect(commandExistsMock).toHaveBeenCalledWith('rtk')
    expect(installQuotaMock).toHaveBeenCalledWith({ skipHeader: true, skipPrompt: true })
    expect(installCavemanMock).toHaveBeenCalledWith(expect.objectContaining({ skipHeader: true, skipPrompt: true }))
    expect(installCodegraphMock).toHaveBeenCalledWith(expect.objectContaining({ skipHeader: true }))
    expect(enableCavemanGuidanceMock).toHaveBeenCalledWith({ optedIn: true, installed: true })
    expect(result.rtk.available).toBe(true)
    expect(result.quota.installed).toBe(true)
    expect(result.caveman.installed).toBe(true)
    expect(result.cavemanGuidance.enabled).toBe(true)
    expect(result.codegraph.installed).toBe(true)
  })

  it('skips all tools when nothing is selected', async () => {
    checkboxMock.mockResolvedValue([])

    const result = await tokenOptimizationStep()

    expect(commandExistsMock).not.toHaveBeenCalled()
    expect(installQuotaMock).not.toHaveBeenCalled()
    expect(installCavemanMock).not.toHaveBeenCalled()
    expect(installCodegraphMock).not.toHaveBeenCalled()
    expect(enableCavemanGuidanceMock).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith('No token optimization tools selected')
    expect(result.rtk.optedIn).toBe(false)
    expect(result.quota.optedIn).toBe(false)
    expect(result.caveman.optedIn).toBe(false)
    expect(result.cavemanGuidance.enabled).toBe(false)
    expect(result.codegraph.optedIn).toBe(false)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  commandExists: vi.fn(),
  header: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

// Mock execa used directly in check-env.js
vi.mock('execa', () => ({ execa: vi.fn() }))

import { commandExists, error, success } from '../../utils/exec.js'
import { checkEnv } from '../check-env.js'

describe('checkEnv()', () => {
  const originalVersion = process.version
  const originalExit = process.exit

  beforeEach(() => {
    process.exit = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(process, 'version', { value: originalVersion, writable: true })
    process.exit = originalExit
  })

  it('exits with error when Node version is < 18', async () => {
    Object.defineProperty(process, 'version', { value: 'v16.0.0', writable: true })
    commandExists.mockResolvedValue(true)

    await checkEnv()

    expect(error).toHaveBeenCalledWith(expect.stringContaining('v16.0.0'))
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('succeeds when Node version is >= 18 and pnpm is available', async () => {
    Object.defineProperty(process, 'version', { value: 'v20.0.0', writable: true })
    commandExists.mockImplementation(async (cmd) => cmd === 'pnpm')

    await checkEnv()

    expect(process.exit).not.toHaveBeenCalled()
    expect(success).toHaveBeenCalledWith(expect.stringContaining('v20.0.0'))
    expect(success).toHaveBeenCalledWith('pnpm available')
  })

  it('succeeds when Node version is >= 18 and only npm is available', async () => {
    Object.defineProperty(process, 'version', { value: 'v18.0.0', writable: true })
    commandExists.mockImplementation(async (cmd) => cmd === 'npm')

    await checkEnv()

    expect(process.exit).not.toHaveBeenCalled()
    expect(success).toHaveBeenCalledWith('npm available')
  })

  it('exits when neither npm nor pnpm available', async () => {
    Object.defineProperty(process, 'version', { value: 'v20.0.0', writable: true })
    commandExists.mockResolvedValue(false)

    await checkEnv()

    expect(error).toHaveBeenCalledWith(expect.stringContaining('Neither npm nor pnpm'))
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

vi.mock('fs-extra', () => ({
  default: {
    readJson: vi.fn().mockResolvedValue({
      installer: { command: 'npx', args: ['@different-ai/opencode-browser', 'install'] },
      output: { showAfter: '===', hideAfter: '===' },
      autoAnswers: [
        { trigger: 'Install', response: 'y' },
      ],
    }),
  },
}))

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

import fse from 'fs-extra'
import { installBrowser } from './index.js'

describe('installBrowser()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls installer command from preset', async () => {
    const { execa } = await import('execa')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn() },
      then: (cb) => cb({ exitCode: 0 }),
    }
    execa.mockReturnValue(mockChild)

    await installBrowser()

    expect(execa).toHaveBeenCalledWith('npx', expect.arrayContaining('@different-ai/opencode-browser'), expect.any(Object))
  })

  it('logs success when exit code is 0', async () => {
    const { execa } = await import('execa')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn() },
      then: (cb) => cb({ exitCode: 0 }),
    }
    execa.mockReturnValue(mockChild)
    const { success } = await import('../../utils/exec.js')

    await installBrowser()

    expect(success).toHaveBeenCalledWith('opencode-browser installed')
  })

  it('logs warning when exit code is non-zero', async () => {
    const { execa } = await import('execa')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      stdin: { write: vi.fn() },
      then: (cb) => cb({ exitCode: 1 }),
    }
    execa.mockReturnValue(mockChild)
    const { warn } = await import('../../utils/exec.js')

    await installBrowser()

    expect(warn).toHaveBeenCalledWith('opencode-browser install exited with non-zero code')
  })
})
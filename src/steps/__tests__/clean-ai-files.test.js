import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}))

vi.mock('../../utils/copy.js', () => ({
  findAiFiles: vi.fn(),
}))

vi.mock('fs-extra', () => ({
  default: { remove: vi.fn() },
}))

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}))

import { findAiFiles } from '../../utils/copy.js'
import { success, warn } from '../../utils/exec.js'
import fse from 'fs-extra'
import { confirm } from '@inquirer/prompts'
import { cleanAiFiles } from '../clean-ai-files.js'

describe('cleanAiFiles()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prints success when no AI files are found', async () => {
    findAiFiles.mockResolvedValue([])

    await cleanAiFiles()

    expect(success).toHaveBeenCalledWith('No existing AI config files found')
    expect(confirm).not.toHaveBeenCalled()
  })

  it('deletes files when user confirms', async () => {
    findAiFiles.mockResolvedValue(['/proj/AGENTS.md', '/proj/CLAUDE.md'])
    confirm.mockResolvedValue(true)

    await cleanAiFiles()

    expect(fse.remove).toHaveBeenCalledWith('/proj/AGENTS.md')
    expect(fse.remove).toHaveBeenCalledWith('/proj/CLAUDE.md')
    expect(success).toHaveBeenCalledWith('Removed existing AI config files')
  })

  it('skips deletion when user declines', async () => {
    findAiFiles.mockResolvedValue(['/proj/AGENTS.md'])
    confirm.mockResolvedValue(false)

    await cleanAiFiles()

    expect(fse.remove).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipped'))
  })
})

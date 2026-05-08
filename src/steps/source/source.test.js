import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  checkbox: vi.fn(),
}))

vi.mock('fs-extra', () => ({
  default: {
    readJson: vi.fn().mockResolvedValue({
      message: 'Select source scope',
      default: 'current',
      choices: [
        { name: 'Current folder', value: 'current' },
        { name: 'Parent folder', value: 'parent' },
      ],
      parentSelectionMessage: 'Select sibling folders',
    }),
    readdir: vi.fn(),
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
  },
}))

import { select, checkbox } from '@inquirer/prompts'
import fse from 'fs-extra'
import { chooseSourceScope } from './index.js'

describe('chooseSourceScope()', () => {
  let tmpDir, originalCwd

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-test-'))
    originalCwd = process.cwd()
    process.chdir(tmpDir)
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns current folder when user selects current mode', async () => {
    select.mockResolvedValue('current')

    const result = await chooseSourceScope()

    expect(result.sourceMode).toBe('current')
    expect(result.sourceRoots).toContain(tmpDir)
  })

  it('lists parent folders when user selects parent mode', async () => {
    select.mockResolvedValue('parent')
    const parentDir = path.dirname(tmpDir)
    const siblingDir = path.join(parentDir, 'sibling-project')
    fs.mkdirSync(siblingDir, { recursive: true })
    fse.readdir.mockResolvedValue(['sibling-project'])

    await chooseSourceScope()

    expect(checkbox).toHaveBeenCalled()
  })

  it('falls back to current when no siblings found', async () => {
    select.mockResolvedValue('parent')
    fse.readdir.mockResolvedValue([])

    const result = await chooseSourceScope()

    expect(result.sourceMode).toBe('current')
  })

  it('falls back to current when no folders selected', async () => {
    select.mockResolvedValue('parent')
    checkbox.mockResolvedValue([])

    const result = await chooseSourceScope()

    expect(result.sourceMode).toBe('current')
  })
})
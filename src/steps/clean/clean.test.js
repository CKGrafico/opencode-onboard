import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fse from 'fs-extra'
import os from 'os'
import path from 'path'

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
}))

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  prompt: vi.fn(),
}))

import { success } from '../../utils/exec.js'
import { checkbox } from '@inquirer/prompts'

describe('cleanAiFiles()', () => {
  let tmpDir
  let originalCwd

  beforeEach(async () => {
    tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 'ob-clean-test-'))
    originalCwd = process.cwd()
    process.chdir(tmpDir)
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await fse.remove(tmpDir)
  })

  it('prints success when no AI files are found', async () => {
    const { cleanAiFiles } = await import('./index.js')

    await cleanAiFiles()

    expect(success).toHaveBeenCalledWith('No existing AI config files to remove')
  })

  it('removes selected AI files', async () => {
    await fse.writeFile(path.join(tmpDir, 'AGENTS.md'), '# agents')
    await fse.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# claude')
    checkbox.mockResolvedValue([
      path.join(tmpDir, 'AGENTS.md'),
      path.join(tmpDir, 'CLAUDE.md'),
    ])

    const { cleanAiFiles } = await import('./index.js')

    await cleanAiFiles()

    expect(await fse.pathExists(path.join(tmpDir, 'AGENTS.md'))).toBe(false)
    expect(await fse.pathExists(path.join(tmpDir, 'CLAUDE.md'))).toBe(false)
    expect(success).toHaveBeenCalledWith('Removed existing AI config files')
  })

  it('keeps unselected AI files', async () => {
    await fse.writeFile(path.join(tmpDir, 'AGENTS.md'), '# agents')
    await fse.writeFile(path.join(tmpDir, 'CLAUDE.md'), '# claude')
    checkbox.mockResolvedValue([path.join(tmpDir, 'AGENTS.md')])

    const { cleanAiFiles } = await import('./index.js')

    await cleanAiFiles()

    expect(await fse.pathExists(path.join(tmpDir, 'AGENTS.md'))).toBe(false)
    expect(await fse.pathExists(path.join(tmpDir, 'CLAUDE.md'))).toBe(true)
  })

  it('removes .agents sub-entries but preserves .agents/skills', async () => {
    const agentsDir = path.join(tmpDir, '.agents')
    await fse.ensureDir(path.join(agentsDir, 'agents'))
    await fse.ensureDir(path.join(agentsDir, 'skills', 'my-skill'))
    await fse.writeFile(path.join(agentsDir, 'agents', 'front-engineer.md'), 'agent')
    await fse.writeFile(path.join(agentsDir, 'skills', 'my-skill', 'SKILL.md'), 'skill')
    checkbox.mockResolvedValue([path.join(agentsDir, 'agents')])

    const { cleanAiFiles } = await import('./index.js')

    await cleanAiFiles()

    expect(await fse.pathExists(path.join(agentsDir, 'agents'))).toBe(false)
    expect(await fse.pathExists(path.join(agentsDir, 'skills', 'my-skill', 'SKILL.md'))).toBe(true)
  })
})

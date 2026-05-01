import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import os from 'os'
import fse from 'fs-extra'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  input: vi.fn(),
}))

import { checkbox, input } from '@inquirer/prompts'
import { success, info } from '../../utils/exec.js'

describe('chooseTeam()', () => {
  let tmpDir
  let originalCwd

  beforeEach(async () => {
    tmpDir = await fse.mkdtemp(path.join(os.tmpdir(), 'ob-team-test-'))
    originalCwd = process.cwd()
    process.chdir(tmpDir)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    process.chdir(originalCwd)
    await fse.remove(tmpDir)
    vi.resetModules()
  })

  it('returns empty array and skips when no agents selected', async () => {
    checkbox.mockResolvedValue([])
    // single empty input to exit the custom loop
    input.mockResolvedValue('')

    // Dynamic import so process.cwd() is captured at call time
    const { chooseTeam } = await import('../choose-team.js')
    const result = await chooseTeam()

    expect(result).toEqual([])
    expect(info).toHaveBeenCalledWith('No agents selected — skipping team setup.')
  })

  it('creates agent files for selected preset agents', async () => {
    checkbox.mockResolvedValue(['frontend', 'backend'])
    input.mockResolvedValue('') // no custom agents

    const { chooseTeam } = await import('../choose-team.js')
    const result = await chooseTeam()

    expect(result).toEqual(['frontend', 'backend'])

    const frontendPath = path.join(tmpDir, '.opencode', 'agents', 'frontend.md')
    const backendPath = path.join(tmpDir, '.opencode', 'agents', 'backend.md')
    expect(await fse.pathExists(frontendPath)).toBe(true)
    expect(await fse.pathExists(backendPath)).toBe(true)
  })

  it('creates agent file for custom agent name', async () => {
    checkbox.mockResolvedValue([])
    input.mockResolvedValueOnce('devops').mockResolvedValueOnce('') // one custom, then stop

    const { chooseTeam } = await import('../choose-team.js')
    const result = await chooseTeam()

    expect(result).toContain('devops')
    const devopsPath = path.join(tmpDir, '.opencode', 'agents', 'devops.md')
    expect(await fse.pathExists(devopsPath)).toBe(true)
  })

  it('normalises custom agent name (lowercase, spaces to dashes)', async () => {
    checkbox.mockResolvedValue([])
    input.mockResolvedValueOnce('My Agent').mockResolvedValueOnce('')

    const { chooseTeam } = await import('../choose-team.js')
    const result = await chooseTeam()

    expect(result).toContain('my-agent')
    const agentPath = path.join(tmpDir, '.opencode', 'agents', 'my-agent.md')
    expect(await fse.pathExists(agentPath)).toBe(true)
  })

  it('skips agent file creation if it already exists', async () => {
    checkbox.mockResolvedValue(['frontend'])
    input.mockResolvedValue('')

    const agentsDir = path.join(tmpDir, '.opencode', 'agents')
    await fse.ensureDir(agentsDir)
    await fse.writeFile(path.join(agentsDir, 'frontend.md'), 'existing content')

    const { chooseTeam } = await import('../choose-team.js')
    await chooseTeam()

    // File should still have original content (not overwritten)
    const content = await fse.readFile(path.join(agentsDir, 'frontend.md'), 'utf-8')
    expect(content).toBe('existing content')
    expect(info).toHaveBeenCalledWith('frontend.md already exists — skipping')
  })
})

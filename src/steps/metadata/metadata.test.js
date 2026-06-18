import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  header: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeJson: vi.fn().mockResolvedValue(undefined),
    // default: no existing file -> rejects so the merge falls back to defaults
    readJson: vi.fn().mockRejectedValue(new Error('ENOENT')),
  },
}))

import { execa } from 'execa'
import fse from 'fs-extra'
import { writeOnboardConfig } from './index.js'

function lastPayload() {
  const call = fse.writeJson.mock.calls[0]
  return call[1]
}

describe('writeOnboardConfig()', () => {
  let tmpDir

  beforeEach(() => {
    vi.clearAllMocks()
    fse.readJson.mockRejectedValue(new Error('ENOENT'))
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes JSON file with all wizard selections', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1.2.3', stderr: '' })

    await writeOnboardConfig({
      platform: 'github',
      sourceMode: 'current',
      sourceRoots: ['/test/path'],
      hasDesign: true,
      hasArchitecture: false,
      hasOpenspec: true,
      maxConcurrentAgents: 4,
      additionalSkillsProvider: 'npx-skills',
      planModel: 'plan-model',
      buildModel: 'build-model',
      fastModel: 'fast-model',
      optionalTools: ['rtk'],
      cavemanGuidance: true,
      cwd: tmpDir,
    })

    expect(fse.ensureDir).toHaveBeenCalled()
    expect(fse.writeJson).toHaveBeenCalled()
    const payload = lastPayload()
    expect(payload.schema).toBe(1)
    expect(payload.wizard.platform).toBe('github')
    expect(payload.wizard.models.build).toBe('build-model')
    expect(payload.wizard.maxConcurrentAgents).toBe(4)
    expect(payload.wizard.optionalTools).toEqual(['rtk'])
  })

  it('detects opencode version from CLI', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '2.0.0', stderr: '' })
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().opencodeVersion).toBe('2.0.0')
  })

  it('handles missing opencode gracefully', async () => {
    execa.mockResolvedValue({ exitCode: 1, stdout: '', stderr: '' })
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().opencodeVersion).toBe(null)
  })

  it('note marks runtime config as load-bearing', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().note).toContain('wizard.maxConcurrentAgents')
  })

  it('persists none as an explicit platform mode', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    await writeOnboardConfig({ platform: 'none', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().wizard.platform).toBe('none')
  })

  it('omits model metadata when no model is selected and none exists', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().wizard.models).toBeUndefined()
  })

  it('defaults maxConcurrentAgents to 3 when unset', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })
    expect(lastPayload().wizard.maxConcurrentAgents).toBe(3)
  })

  it('clamps maxConcurrentAgents to the 1..5 range', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })

    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], maxConcurrentAgents: 9, cwd: tmpDir })
    expect(lastPayload().wizard.maxConcurrentAgents).toBe(5)

    fse.writeJson.mockClear()
    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], maxConcurrentAgents: 0, cwd: tmpDir })
    expect(lastPayload().wizard.maxConcurrentAgents).toBe(1)
  })

  it('preserves existing models and maxConcurrentAgents when not provided (merge)', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    fse.readJson.mockResolvedValueOnce({
      wizard: { models: { plan: 'p', build: 'b', fast: 'f' }, maxConcurrentAgents: 5 },
    })

    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [], cwd: tmpDir })

    const payload = lastPayload()
    expect(payload.wizard.models).toEqual({ plan: 'p', build: 'b', fast: 'f' })
    expect(payload.wizard.maxConcurrentAgents).toBe(5)
  })

  it('new selections override preserved config', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })
    fse.readJson.mockResolvedValueOnce({
      wizard: { models: { build: 'old' }, maxConcurrentAgents: 2 },
    })

    await writeOnboardConfig({
      platform: 'github',
      sourceMode: 'current',
      sourceRoots: [],
      buildModel: 'new',
      maxConcurrentAgents: 4,
      cwd: tmpDir,
    })

    const payload = lastPayload()
    expect(payload.wizard.models.build).toBe('new')
    expect(payload.wizard.maxConcurrentAgents).toBe(4)
  })
})

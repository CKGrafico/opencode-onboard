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
  },
}))

import { execa } from 'execa'
import fse from 'fs-extra'
import { writeOnboardConfig } from './index.js'

describe('writeOnboardConfig()', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metadata-test-'))
    process.chdir(tmpDir)
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
      additionalSkillsProvider: 'npx-skills',
      planModel: 'plan-model',
      buildModel: 'build-model',
      fastModel: 'fast-model',
      optionalTools: ['rtk'],
      cavemanGuidance: true,
    })

    expect(fse.ensureDir).toHaveBeenCalled()
    expect(fse.writeJson).toHaveBeenCalled()
    const call = fse.writeJson.mock.calls[0]
    const payload = call[0]
    expect(payload.schema).toBe(1)
    expect(payload.wizard.platform).toBe('github')
    expect(payload.wizard.models.build).toBe('build-model')
    expect(payload.wizard.optionalTools).toEqual(['rtk'])
  })

  it('detects opencode version from CLI', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '2.0.0', stderr: '' })

    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [] })

    const call = fse.writeJson.mock.calls[0]
    const payload = call[0]
    expect(payload.opencodeVersion).toBe('2.0.0')
  })

  it('handles missing opencode gracefully', async () => {
    execa.mockResolvedValue({ exitCode: 1, stdout: '', stderr: '' })

    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [] })

    const call = fse.writeJson.mock.calls[0]
    const payload = call[0]
    expect(payload.opencodeVersion).toBe(null)
  })

  it('includes note field', async () => {
    execa.mockResolvedValue({ exitCode: 0, stdout: '1', stderr: '' })

    await writeOnboardConfig({ platform: 'github', sourceMode: 'current', sourceRoots: [] })

    const call = fse.writeJson.mock.calls[0]
    const payload = call[0]
    expect(payload.note).toContain('Informational file only')
  })
})
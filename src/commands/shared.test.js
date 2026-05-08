import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { readOnboardConfig } from './shared.js'

describe('readOnboardConfig()', () => {
  let tmpDir, originalCwd

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-test-'))
    originalCwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns null when config file does not exist', async () => {
    const result = await readOnboardConfig()

    expect(result).toBeNull()
  })

  it('returns parsed config when file exists', async () => {
    const configDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(configDir)
    fs.writeFileSync(
      path.join(configDir, 'opencode-onboard.json'),
      JSON.stringify({ schema: 1, wizard: { platform: 'github' } }),
      'utf-8'
    )

    const result = await readOnboardConfig()

    expect(result).not.toBeNull()
    expect(result.schema).toBe(1)
    expect(result.wizard.platform).toBe('github')
  })

  it('returns null when file contains invalid JSON', async () => {
    const configDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(configDir)
    fs.writeFileSync(
      path.join(configDir, 'opencode-onboard.json'),
      'not valid json',
      'utf-8'
    )

    const result = await readOnboardConfig()

    expect(result).toBeNull()
  })
})

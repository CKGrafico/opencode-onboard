import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
}))

import { patchOpencodeJson } from './opencode-json.js'

let tmpDir

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-json-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function readConfig() {
  const p = path.join(tmpDir, '.opencode', 'opencode.json')
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

describe('patchOpencodeJson()', () => {
  it('creates the file with agent block when missing', async () => {
    await patchOpencodeJson()

    const config = readConfig()
    expect(config.agent.build.disable).toBe(true)
    expect(config.agent.plan.disable).toBe(true)
    expect(config.$schema).toBe('https://opencode.ai/config.json')
  })

  it('adds agent block to existing config without touching other keys', async () => {
    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(
      path.join(opencodeDir, 'opencode.json'),
      JSON.stringify({
        $schema: 'https://opencode.ai/config.json',
        model: 'anthropic/claude-sonnet-4-5',
        plugin: ['some-plugin'],
      }, null, 2),
    )

    await patchOpencodeJson()

    const config = readConfig()
    expect(config.agent.build.disable).toBe(true)
    expect(config.agent.plan.disable).toBe(true)
    expect(config.model).toBe('anthropic/claude-sonnet-4-5')
    expect(config.plugin).toEqual(['some-plugin'])
  })

  it('does not write when already disabled', async () => {
    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(
      path.join(opencodeDir, 'opencode.json'),
      JSON.stringify({
        $schema: 'https://opencode.ai/config.json',
        agent: { build: { disable: true }, plan: { disable: true } },
      }, null, 2),
    )

    const result = await patchOpencodeJson()
    expect(result.patched).toBe(false)
  })

  it('preserves comments in JSONC files', async () => {
    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    const jsonc = `{
  // This is a comment
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5"
}
`
    fs.writeFileSync(path.join(opencodeDir, 'opencode.json'), jsonc)

    await patchOpencodeJson()

    const content = fs.readFileSync(path.join(opencodeDir, 'opencode.json'), 'utf-8')
    expect(content).toContain('This is a comment')
    expect(content).toContain('"disable": true')
  })

  it('returns patched:false on parse error', async () => {
    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(path.join(opencodeDir, 'opencode.json'), '{ invalid json }')

    const result = await patchOpencodeJson()
    expect(result.patched).toBe(false)
    expect(result.reason).toBe('parse error')
  })
})

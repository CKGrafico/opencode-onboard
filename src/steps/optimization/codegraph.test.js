import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import fse from 'fs-extra'

vi.mock('execa', () => ({ execa: vi.fn() }))
vi.mock('../../utils/exec.js')

import { warn } from '../../utils/exec.js'
import { fixCodegraphConfig } from './codegraph.js'

describe('fixCodegraphConfig()', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-test-'))
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('returns true when opencode.jsonc does not exist', async () => {
    const result = await fixCodegraphConfig()
    expect(result).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.opencode', 'opencode.json'))).toBe(false)
  })

  it('merges mcpServers from opencode.jsonc into .opencode/opencode.json as mcp', async () => {
    const rogueContent = {
      mcpServers: {
        codegraph: { command: ['codegraph', 'serve', '--mcp'] }
      }
    }
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), JSON.stringify(rogueContent))

    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(path.join(opencodeDir, 'opencode.json'), JSON.stringify({
      "$schema": "https://opencode.ai/config.json",
      "plugin": ["opencode-plugin-openspec@latest"]
    }))

    const result = await fixCodegraphConfig()

    expect(result).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
    const readResult = await fse.readJson(path.join(opencodeDir, 'opencode.json'))
    expect(readResult.mcp.codegraph).toEqual({ command: ['npx', '@colbymchenry/codegraph', 'serve', '--mcp'], timeout: 120000 })
    expect(readResult.plugin).toEqual(["opencode-plugin-openspec@latest"])
  })

  it('handles rogue file with mcp key directly', async () => {
    const rogueContent = {
      mcp: {
        codegraph: { command: ['codegraph', 'serve', '--mcp'] }
      }
    }
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), JSON.stringify(rogueContent))
    fs.mkdirSync(path.join(tmpDir, '.opencode'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.opencode', 'opencode.json'), '{}')

    const result = await fixCodegraphConfig()

    expect(result).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
    const readResult = await fse.readJson(path.join(tmpDir, '.opencode', 'opencode.json'))
    expect(readResult.mcp.codegraph.command).toEqual(['npx', '@colbymchenry/codegraph', 'serve', '--mcp'])
  })

  it('handles JSONC with comments', async () => {
    const rogueRaw = `{
      // This is a comment
      "mcpServers": {
        "codegraph": { "command": ["codegraph", "serve", "--mcp"] }
      }
    }`
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), rogueRaw)

    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(path.join(opencodeDir, 'opencode.json'), '{}')

    const result = await fixCodegraphConfig()

    expect(result).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
    const readResult = await fse.readJson(path.join(opencodeDir, 'opencode.json'))
    expect(readResult.mcp.codegraph.command).toEqual(['npx', '@colbymchenry/codegraph', 'serve', '--mcp'])
  })

  it('handles JSONC with URLs containing //', async () => {
    const rogueRaw = `{
  "url": "https://example.com/path",
  "mcpServers": {
    "codegraph": { "command": ["codegraph", "serve", "--mcp"] }
  }
}`
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), rogueRaw)

    const opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
    fs.writeFileSync(path.join(opencodeDir, 'opencode.json'), '{}')

    const result = await fixCodegraphConfig()

    // The old regex-based parser would have mangled the URL and failed.
    // jsonc-parser handles this correctly.
    expect(result).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
    const readResult = await fse.readJson(path.join(opencodeDir, 'opencode.json'))
    expect(readResult.mcp.codegraph.command).toEqual(['npx', '@colbymchenry/codegraph', 'serve', '--mcp'])
  })

  it('removes unparseable opencode.jsonc, warns, and returns false', async () => {
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), 'not valid json {{{')

    const result = await fixCodegraphConfig()

    expect(result).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
    expect(warn).toHaveBeenCalledWith('Could not parse opencode.jsonc, removing it')
  })

  it('creates .opencode/opencode.json if it does not exist', async () => {
    const rogueContent = {
      mcpServers: {
        codegraph: { command: ['codegraph', 'serve', '--mcp'] }
      }
    }
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), JSON.stringify(rogueContent))

    const result = await fixCodegraphConfig()

    expect(result).toBe(true)
    const readResult = await fse.readJson(path.join(tmpDir, '.opencode', 'opencode.json'))
    expect(readResult.mcp.codegraph.command).toEqual(['npx', '@colbymchenry/codegraph', 'serve', '--mcp'])
    expect(fs.existsSync(path.join(tmpDir, 'opencode.jsonc'))).toBe(false)
  })

  it('preserves an explicit codegraph timeout instead of overwriting it', async () => {
    const rogueContent = {
      mcpServers: {
        codegraph: { command: ['codegraph', 'serve', '--mcp'], timeout: 300000 }
      }
    }
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), JSON.stringify(rogueContent))
    fs.mkdirSync(path.join(tmpDir, '.opencode'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.opencode', 'opencode.json'), '{}')

    await fixCodegraphConfig()

    const readResult = await fse.readJson(path.join(tmpDir, '.opencode', 'opencode.json'))
    expect(readResult.mcp.codegraph.timeout).toBe(300000)
  })

  it('does not prepend npx to non-codegraph commands', async () => {
    const rogueContent = {
      mcpServers: {
        myMcp: { command: ['my-own-mcp', 'serve'] }
      }
    }
    fs.writeFileSync(path.join(tmpDir, 'opencode.jsonc'), JSON.stringify(rogueContent))
    fs.mkdirSync(path.join(tmpDir, '.opencode'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.opencode', 'opencode.json'), '{}')

    const result = await fixCodegraphConfig()

    expect(result).toBe(true)
    const readResult = await fse.readJson(path.join(tmpDir, '.opencode', 'opencode.json'))
    expect(readResult.mcp.myMcp.command).toEqual(['my-own-mcp', 'serve'])
  })
})

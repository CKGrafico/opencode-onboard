import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
}))

import { setFrontmatterModel, stampAgentModels } from './agent-models.js'

describe('setFrontmatterModel()', () => {
  it('inserts model into existing frontmatter without one', () => {
    const out = setFrontmatterModel('---\ndescription: x\nmode: all\n---\n\nbody', 'opencode/big-pickle')
    expect(out).toMatch(/^---\n[\s\S]*model: opencode\/big-pickle[\s\S]*\n---/)
    expect(out).toContain('description: x')
    expect(out).toContain('body')
  })

  it('replaces an existing model field', () => {
    const out = setFrontmatterModel('---\nmodel: old/model\nmode: all\n---\nbody', 'new/model')
    expect(out).toContain('model: new/model')
    expect(out).not.toContain('old/model')
  })

  it('creates frontmatter when none exists', () => {
    const out = setFrontmatterModel('just body', 'p/m')
    expect(out).toBe('---\nmodel: p/m\n---\n\njust body')
  })
})

describe('stampAgentModels()', () => {
  let tmpDir, agentsDir

  function writeAgent(name, body) {
    fs.writeFileSync(path.join(agentsDir, name), body, 'utf-8')
  }

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-models-test-'))
    agentsDir = path.join(tmpDir, '.opencode', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('stamps basic-engineer with the fast model and a specialist with the build model', async () => {
    writeAgent('basic-engineer.md', '---\ndescription: Basic.\nmode: all\n---\n\n## Abilities')
    writeAgent('frontend-engineer.md', '---\ndescription: Frontend.\nmode: all\n---\n\n## Abilities')

    const res = await stampAgentModels({ models: { build: 'prov/build-m', fast: 'prov/fast-m' }, cwd: tmpDir })
    expect(res.stamped).toBe(2)

    expect(fs.readFileSync(path.join(agentsDir, 'basic-engineer.md'), 'utf-8')).toContain('model: prov/fast-m')
    expect(fs.readFileSync(path.join(agentsDir, 'frontend-engineer.md'), 'utf-8')).toContain('model: prov/build-m')
  })

  it('does not produce any -build / -fast variant files', async () => {
    writeAgent('basic-engineer.md', '---\ndescription: Basic.\nmode: all\n---')
    await stampAgentModels({ models: { build: 'b', fast: 'f' }, cwd: tmpDir })
    const files = fs.readdirSync(agentsDir)
    expect(files).toEqual(['basic-engineer.md'])
  })

  it('respects an engineer that already declares a model (no override)', async () => {
    writeAgent('architect-engineer.md', '---\ndescription: Arch.\nmodel: custom/plan-m\nmode: all\n---')
    const res = await stampAgentModels({ models: { build: 'prov/build-m', fast: 'prov/fast-m' }, cwd: tmpDir })
    expect(res.stamped).toBe(0)
    expect(fs.readFileSync(path.join(agentsDir, 'architect-engineer.md'), 'utf-8')).toContain('model: custom/plan-m')
  })

  it('skips when the needed tier model is unset', async () => {
    writeAgent('basic-engineer.md', '---\ndescription: Basic.\nmode: all\n---')
    const res = await stampAgentModels({ models: { build: 'b' }, cwd: tmpDir })
    expect(res.stamped).toBe(0)
  })

  it('returns 0 when no agents dir exists', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-models-empty-'))
    const res = await stampAgentModels({ models: { build: 'b', fast: 'f' }, cwd: empty })
    expect(res.stamped).toBe(0)
    fs.rmSync(empty, { recursive: true, force: true })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
}))

import { setFrontmatterModel, generateAgentVariants } from './variants.js'

describe('setFrontmatterModel()', () => {
  it('inserts model into existing frontmatter without one', () => {
    const out = setFrontmatterModel('---\ndescription: x\nmode: subagent\n---\n\nbody', 'opencode/big-pickle')
    expect(out).toMatch(/^---\n[\s\S]*model: opencode\/big-pickle[\s\S]*\n---/)
    expect(out).toContain('description: x')
    expect(out).toContain('body')
  })

  it('replaces an existing model field', () => {
    const out = setFrontmatterModel('---\nmodel: old/model\nmode: subagent\n---\nbody', 'new/model')
    expect(out).toContain('model: new/model')
    expect(out).not.toContain('old/model')
  })

  it('creates frontmatter when none exists', () => {
    const out = setFrontmatterModel('just body', 'p/m')
    expect(out).toBe('---\nmodel: p/m\n---\n\njust body')
  })
})

describe('generateAgentVariants()', () => {
  let tmpDir, agentsDir

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'variants-test-'))
    agentsDir = path.join(tmpDir, '.opencode', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    fs.writeFileSync(
      path.join(agentsDir, 'basic-engineer.md'),
      '---\ndescription: Basic Engineer.\nmode: subagent\n---\n\n## Abilities\n- Development: @ob-default',
      'utf-8'
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('generates build and fast variants with the right models', async () => {
    const res = await generateAgentVariants({
      models: { build: 'prov/build-m', fast: 'prov/fast-m' },
      cwd: tmpDir,
    })
    expect(res.generated).toBe(2)

    const build = fs.readFileSync(path.join(agentsDir, 'basic-engineer-build.md'), 'utf-8')
    const fast = fs.readFileSync(path.join(agentsDir, 'basic-engineer-fast.md'), 'utf-8')
    expect(build).toContain('model: prov/build-m')
    expect(fast).toContain('model: prov/fast-m')
    expect(build).toContain('## Abilities')
  })

  it('skips a tier with no model', async () => {
    const res = await generateAgentVariants({ models: { build: 'prov/build-m' }, cwd: tmpDir })
    expect(res.generated).toBe(1)
    expect(fs.existsSync(path.join(agentsDir, 'basic-engineer-build.md'))).toBe(true)
    expect(fs.existsSync(path.join(agentsDir, 'basic-engineer-fast.md'))).toBe(false)
  })

  it('does not treat existing variants as base files (idempotent)', async () => {
    await generateAgentVariants({ models: { build: 'prov/build-m', fast: 'prov/fast-m' }, cwd: tmpDir })
    const res = await generateAgentVariants({ models: { build: 'prov/build-m', fast: 'prov/fast-m' }, cwd: tmpDir })
    // still only the one base engineer -> 2 variants, no -build-build etc.
    expect(res.generated).toBe(2)
    expect(fs.existsSync(path.join(agentsDir, 'basic-engineer-build-build.md'))).toBe(false)
  })

  it('regenerates variants with updated models (ob-model behaviour)', async () => {
    await generateAgentVariants({ models: { build: 'old/m' }, cwd: tmpDir })
    await generateAgentVariants({ models: { build: 'new/m' }, cwd: tmpDir })
    const build = fs.readFileSync(path.join(agentsDir, 'basic-engineer-build.md'), 'utf-8')
    expect(build).toContain('model: new/m')
    expect(build).not.toContain('old/m')
  })

  it('returns 0 when no agents dir exists', async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'variants-empty-'))
    const res = await generateAgentVariants({ models: { build: 'x/y' }, cwd: empty })
    expect(res.generated).toBe(0)
    fs.rmSync(empty, { recursive: true, force: true })
  })
})

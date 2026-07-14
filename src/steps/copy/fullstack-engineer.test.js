import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
  info: vi.fn(),
}))

import { generateFullstackEngineer } from './fullstack-engineer.js'

describe('generateFullstackEngineer()', () => {
  let tmpDir

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fullstack-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('generates bare-bones fullstack-engineer.md with only guardrails by default', async () => {
    const res = await generateFullstackEngineer({ cwd: tmpDir })
    expect(res.generated).toBe(true)

    const content = fs.readFileSync(path.join(tmpDir, '.opencode', 'agents', 'fullstack-engineer.md'), 'utf-8')
    expect(content).toContain('mode: primary')
    expect(content).toContain('color: success')
    expect(content).toContain('- Guardrails: @ob-generic-guardrails, @ob-default')
    expect(content).toContain('- Development: @ob-default')
    expect(content).toContain('- Testing: @ob-default')
    expect(content).toContain('- Infrastructure: @ob-default')
    expect(content).not.toContain('@react19')
    expect(content).not.toContain('@dotnet')
    expect(content).not.toContain('@browser-automation')
  })

  it('preserves existing model field when regenerating', async () => {
    const agentsDir = path.join(tmpDir, '.opencode', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    fs.writeFileSync(
      path.join(agentsDir, 'fullstack-engineer.md'),
      '---\ndescription: Old.\nmode: primary\nmodel: custom/model\n---\n\n## Abilities\n- Guardrails: @ob-generic-guardrails, @ob-default\n',
      'utf-8'
    )

    await generateFullstackEngineer({ cwd: tmpDir })

    const content = fs.readFileSync(path.join(agentsDir, 'fullstack-engineer.md'), 'utf-8')
    expect(content).toContain('model: custom/model')
  })

  it('preserves existing abilities when regenerating (e.g. skills added by /create-engineer)', async () => {
    const agentsDir = path.join(tmpDir, '.opencode', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    const existing = [
      '---',
      'description: Old.',
      'mode: primary',
      'model: custom/model',
      '---',
      '',
      '## Abilities',
      '- Guardrails: @ob-generic-guardrails, @ob-default',
      '- Development: @react19-concurrent-patterns, @dotnet-best-practices',
      '- Testing: @react19-test-patterns',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(agentsDir, 'fullstack-engineer.md'), existing, 'utf-8')

    await generateFullstackEngineer({ cwd: tmpDir })

    const content = fs.readFileSync(path.join(agentsDir, 'fullstack-engineer.md'), 'utf-8')
    expect(content).toContain('@react19-concurrent-patterns')
    expect(content).toContain('@dotnet-best-practices')
    expect(content).toContain('@react19-test-patterns')
    expect(content).toContain('model: custom/model')
  })
})

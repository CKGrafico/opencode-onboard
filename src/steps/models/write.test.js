import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
}))

import { success } from '../../utils/exec.js'
import { writeModelToAgent, writeModelsToConfigs } from './write.js'

describe('writeModelToAgent()', () => {
  let tmpDir

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'models-write-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('adds model field to agent file frontmatter', async () => {
    const filePath = path.join(tmpDir, 'test-agent.md')
    const original = `---
name: Test Agent
description: A test agent
---

# Test Agent`
    fs.writeFileSync(filePath, original, 'utf-8')

    await writeModelToAgent(filePath, 'anthropic/claude-3-sonnet')

    const updated = fs.readFileSync(filePath, 'utf-8')
    expect(updated).toContain('model: anthropic/claude-3-sonnet')
  })

  it('preserves existing frontmatter fields', async () => {
    const filePath = path.join(tmpDir, 'test-agent.md')
    const original = `---
name: Test Agent
description: A test agent
custom_field: custom_value
---

# Test Agent`
    fs.writeFileSync(filePath, original, 'utf-8')

    await writeModelToAgent(filePath, 'test/model')

    const updated = fs.readFileSync(filePath, 'utf-8')
    expect(updated).toContain('name: Test Agent')
    expect(updated).toContain('description: A test agent')
    expect(updated).toContain('custom_field: custom_value')
    expect(updated).toContain('model: test/model')
  })
})

describe('writeModelsToConfigs()', () => {
  let tmpDir, agentsDir, opencodeJsonPath, originalCwd

  beforeEach(() => {
    vi.clearAllMocks()
    originalCwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'models-config-test-'))
    agentsDir = path.join(tmpDir, '.agents', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    opencodeJsonPath = path.join(tmpDir, '.opencode', 'opencode.json')
    path.join(tmpDir, '.opencode', 'ensemble.json')
    fs.mkdirSync(path.dirname(opencodeJsonPath), { recursive: true })
    process.chdir(tmpDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes build model to agent files', async () => {
    fs.writeFileSync(path.join(agentsDir, 'back-engineer.md'), '---\nname: Back\n---', 'utf-8')
    fs.writeFileSync(path.join(agentsDir, 'front-engineer.md'), '---\nname: Front\n---', 'utf-8')

    await writeModelsToConfigs({
      planModel: 'plan-model',
      buildModel: 'build-model',
      fastModel: 'fast-model',
      agentsDir,
      preset: {
        roles: {
          build: { agents: ['back-engineer'] },
          fast: { agents: ['front-engineer'] },
        },
      },
    })

    expect(success).toHaveBeenCalledWith('back-engineer → build-model')
    expect(success).toHaveBeenCalledWith('front-engineer → fast-model')
  })

  it('reports success when writing configs', async () => {
    const agentFile = path.join(agentsDir, 'back-engineer.md')
    fs.writeFileSync(agentFile, '---\nname: Back\n---', 'utf-8')

    await writeModelsToConfigs({
      planModel: 'plan-model',
      buildModel: 'build-model',
      fastModel: 'fast-model',
      agentsDir,
      preset: { roles: { build: { agents: ['back-engineer'] }, fast: { agents: [] } } },
    })

    expect(success).toHaveBeenCalled()
  })
})

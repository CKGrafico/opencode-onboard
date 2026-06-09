import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  success: vi.fn(),
}))

import { success } from '../../utils/exec.js'
import { writeModelsToConfigs } from './write.js'

describe('writeModelsToConfigs()', () => {
  let tmpDir, opencodeDir

  beforeEach(() => {
    vi.clearAllMocks()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'models-config-test-'))
    opencodeDir = path.join(tmpDir, '.opencode')
    fs.mkdirSync(opencodeDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('writes build model to opencode.json', async () => {
    const opencodeJsonPath = path.join(opencodeDir, 'opencode.json')
    fs.writeFileSync(opencodeJsonPath, JSON.stringify({ theme: 'dark' }, null, 2), 'utf-8')

    await writeModelsToConfigs({ planModel: 'plan-model', buildModel: 'build-model', fastModel: 'fast-model', cwd: tmpDir })

    const config = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'))
    expect(config.model).toBe('build-model')
    expect(success).toHaveBeenCalledWith(expect.stringContaining('build-model'))
  })

  it('writes plan, build and fast models to ensemble.json modelsByAgent', async () => {
    const ensembleJsonPath = path.join(opencodeDir, 'ensemble.json')
    fs.writeFileSync(ensembleJsonPath, JSON.stringify({ dashboardPort: 4747 }, null, 2), 'utf-8')

    await writeModelsToConfigs({ planModel: 'plan-model', buildModel: 'build-model', fastModel: 'fast-model', cwd: tmpDir })

    const ensemble = JSON.parse(fs.readFileSync(ensembleJsonPath, 'utf-8'))
    expect(ensemble.modelsByAgent.plan).toBe('plan-model')
    expect(ensemble.modelsByAgent.build).toBe('build-model')
    expect(ensemble.modelsByAgent.explore).toBe('fast-model')
  })

  it('removes model entries when null is passed', async () => {
    const opencodeJsonPath = path.join(opencodeDir, 'opencode.json')
    const ensembleJsonPath = path.join(opencodeDir, 'ensemble.json')
    fs.writeFileSync(opencodeJsonPath, JSON.stringify({ model: 'old-model', theme: 'dark' }, null, 2), 'utf-8')
    fs.writeFileSync(ensembleJsonPath, JSON.stringify({ modelsByAgent: { plan: 'a', build: 'b', explore: 'c', keep: 'yes' } }, null, 2), 'utf-8')

    await writeModelsToConfigs({ planModel: null, buildModel: null, fastModel: null, cwd: tmpDir })

    expect(JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'))).toEqual({ theme: 'dark' })
    expect(JSON.parse(fs.readFileSync(ensembleJsonPath, 'utf-8'))).toEqual({ modelsByAgent: { keep: 'yes' } })
    expect(success).not.toHaveBeenCalled()
  })
})

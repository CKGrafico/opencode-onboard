import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

import { configureAgentsMd } from './global.js'

const AGENTS_TEMPLATE = `## Optimizations

<!-- OB-RTK-START -->
placeholder
<!-- OB-RTK-END -->

<!-- OB-CAVEMAN-START -->
placeholder
<!-- OB-CAVEMAN-END -->

<!-- OB-CODEGRAPH-START -->
placeholder
<!-- OB-CODEGRAPH-END -->

<!-- OB-MEMORY-START -->
placeholder
<!-- OB-MEMORY-END -->
`

describe('configureAgentsMd()', () => {
  let tmpDir
  let agentsMdPath

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-md-test-'))
    agentsMdPath = path.join(tmpDir, 'AGENTS.md')
    fs.writeFileSync(agentsMdPath, AGENTS_TEMPLATE, 'utf-8')
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('returns configured:false when AGENTS.md is missing', async () => {
    fs.rmSync(agentsMdPath)
    const result = await configureAgentsMd()
    expect(result).toEqual({ configured: false })
  })

  it('injects RTK section when rtk is opted in', async () => {
    await configureAgentsMd({ rtk: { optedIn: true } })
    const content = fs.readFileSync(agentsMdPath, 'utf-8')
    expect(content).toContain('Prefix ALL CLI commands')
  })

  it('injects caveman section when caveman is opted in', async () => {
    await configureAgentsMd({ caveman: { optedIn: true } })
    const content = fs.readFileSync(agentsMdPath, 'utf-8')
    expect(content).toContain('Caveman mode active')
  })

  it('injects codegraph section when codegraph is opted in', async () => {
    await configureAgentsMd({ codegraph: { optedIn: true } })
    const content = fs.readFileSync(agentsMdPath, 'utf-8')
    expect(content).toContain('CodeGraph')
  })

  it('injects memory section when memory is opted in', async () => {
    await configureAgentsMd({ memory: { optedIn: true } })
    const content = fs.readFileSync(agentsMdPath, 'utf-8')
    expect(content).toContain('Basic Memory')
  })

  it('returns configured:true on success', async () => {
    const result = await configureAgentsMd({})
    expect(result.configured).toBe(true)
    expect(result.path).toBe(agentsMdPath)
  })
})

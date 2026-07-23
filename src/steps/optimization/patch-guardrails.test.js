import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/exec.js')

import { patchGuardrails } from './patch-guardrails.js'

let tmpDir

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardrails-patch-'))
  fs.mkdirSync(path.join(tmpDir, '.agents', 'skills', 'ob-plan-apply'), { recursive: true })
  fs.writeFileSync(
    path.join(tmpDir, '.agents', 'skills', 'ob-plan-apply', 'SKILL.md'),
    '<!-- OB-OPTIMIZATION-CODEGRAPH-START -->\nstale CodeGraph guidance\n<!-- OB-OPTIMIZATION-CODEGRAPH-END -->\n\n<!-- OB-OPTIMIZATION-MEMORY-START -->\nstale memory guidance\n<!-- OB-OPTIMIZATION-MEMORY-END -->\n',
  )
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('patchGuardrails optional tool sections', () => {
  it('injects selected guidance and clears unselected guidance', async () => {
    await patchGuardrails({ codegraph: true, memory: false }, { cwd: tmpDir })

    const content = fs.readFileSync(path.join(tmpDir, '.agents', 'skills', 'ob-plan-apply', 'SKILL.md'), 'utf-8')
    expect(content).toContain('Use `codegraph_explore` to refine relevant symbols')
    expect(content).not.toContain('Use Agentmemory MCP tools')
    expect(content).not.toContain('stale memory guidance')
  })
})

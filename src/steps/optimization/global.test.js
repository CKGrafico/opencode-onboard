import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

vi.mock('../../utils/exec.js', () => ({
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
}))

import { configureObGlobal } from './global.js'

const SKILL_TEMPLATE = `## Token Optimization Rules

<!-- OB-SOURCE-ROOTS-START -->
placeholder
<!-- OB-SOURCE-ROOTS-END -->

<!-- OB-RTK-START -->
placeholder
<!-- OB-RTK-END -->

<!-- OB-CAVEMAN-START -->
placeholder
<!-- OB-CAVEMAN-END -->

<!-- OB-CODEGRAPH-START -->
placeholder
<!-- OB-CODEGRAPH-END -->
`

describe('configureObGlobal()', () => {
  let tmpDir
  let skillPath

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-global-test-'))
    const skillDir = path.join(tmpDir, '.agents', 'skills', 'ob-global')
    fs.mkdirSync(skillDir, { recursive: true })
    skillPath = path.join(skillDir, 'SKILL.md')
    fs.writeFileSync(skillPath, SKILL_TEMPLATE, 'utf-8')
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('returns configured:false when ob-global skill is missing', async () => {
    fs.rmSync(skillPath)
    const result = await configureObGlobal()
    expect(result).toEqual({ configured: false })
  })

  it('injects source roots section', async () => {
    await configureObGlobal({ sourceRoots: [tmpDir] }, {})
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('Read and analyze code ONLY from these roots')
  })

  it('injects RTK section when rtk is opted in', async () => {
    await configureObGlobal({}, { rtk: { optedIn: true } })
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('RTK, MANDATORY')
    expect(content).toContain('NO automatic hook in OpenCode')
    expect(content).toContain('rtk pnpm build')
    expect(content).toContain('rtk npx tsc')
  })

  it('injects RTK not-selected note when rtk is not opted in', async () => {
    await configureObGlobal({}, { rtk: { optedIn: false } })
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('RTK was not selected during onboarding')
  })

  it('injects caveman section when caveman is opted in', async () => {
    await configureObGlobal({}, { caveman: { optedIn: true } })
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('caveman mode')
  })

  it('injects codegraph section when codegraph is opted in', async () => {
    await configureObGlobal({}, { codegraph: { optedIn: true } })
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('CodeGraph')
    expect(content).toContain('codegraph_explore')
  })

  it('injects codegraph not-selected note when codegraph is not opted in', async () => {
    await configureObGlobal({}, { codegraph: { optedIn: false } })
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('Codegraph was not selected during onboarding')
  })

  it('returns configured:true with skill path on success', async () => {
    const result = await configureObGlobal({}, {})
    expect(result.configured).toBe(true)
    expect(result.path).toBe(skillPath)
  })
})

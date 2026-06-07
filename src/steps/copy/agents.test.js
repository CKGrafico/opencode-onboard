import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import fse from 'fs-extra'
import { patchAgentGuidance, patchDevopsManagerMd } from './agents.js'

describe('platform patching', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-patch-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('patches AGENTS.md for none mode with raw-conversation workflow', async () => {
    const source = path.join(process.cwd(), 'content', 'AGENTS.md')
    const dest = path.join(tmpDir, 'AGENTS.md')
    await fse.copyFile(source, dest)

    await patchAgentGuidance('none', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('GitHub Issue URLs, Azure DevOps work item URLs, and PR URLs are NOT automatic triggers in this mode.')
    expect(content).toContain('There is no PR shipping phase and no PR feedback loop in `none` mode.')
    expect(content).not.toContain('A GitHub or Azure DevOps URL anywhere in the user\'s message is always a trigger')
  })

  it('patches devops-manager for none mode without platform skills', async () => {
    const source = path.join(process.cwd(), 'content', '.agents', 'agents', 'devops-manager.md')
    const dest = path.join(tmpDir, '.agents', 'agents', 'devops-manager.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchDevopsManagerMd('none', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('Selected platform: `none`')
    expect(content).toContain('Do NOT load `ob-userstory-gh`, `ob-userstory-az`, `ob-pullrequest-gh`, or `ob-pullrequest-az`.')
    expect(content).toContain('This project does not use GitHub or Azure DevOps integration.')
  })
})

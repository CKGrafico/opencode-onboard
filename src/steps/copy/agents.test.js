import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import fse from 'fs-extra'
import { patchAgentGuidance, patchArchiveCommand } from './agents.js'

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
    expect(content).toContain('There is no PR shipping phase in')
    expect(content).not.toContain('A GitHub or Azure DevOps URL anywhere in the user\'s message is always a trigger')
  })

  it('patches ob-archive for azure platform', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'ob-archive.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'ob-archive.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('azure', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('az repos pr list --repository {repo} --status completed')
    expect(content).not.toContain('gh pr list --repo {owner}/{repo} --state merged')
  })

  it('patches ob-archive for github platform', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'ob-archive.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'ob-archive.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('github', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('gh pr list --repo {owner}/{repo} --state merged')
    expect(content).not.toContain('az repos pr list --repository {repo} --status completed')
  })
})

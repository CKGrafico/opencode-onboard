import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import fse from 'fs-extra'
import { patchArchiveCommand } from './commands.js'

describe('platform patching', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agents-patch-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
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

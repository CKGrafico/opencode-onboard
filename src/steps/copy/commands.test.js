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

  it('patches archive-plan for azure platform', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'archive-plan.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'archive-plan.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('azure', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('az repos pr list --repository {repo} --status completed')
    expect(content).not.toContain('gh pr list --repo {owner}/{repo} --state merged')
  })

  it('patches archive-plan for github platform', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'archive-plan.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'archive-plan.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('github', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('gh pr list --repo {owner}/{repo} --state merged')
    expect(content).not.toContain('az repos pr list --repository {repo} --status completed')
  })

  it('patches archive-plan for none platform without throwing', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'archive-plan.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'archive-plan.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('none', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    expect(content).toContain('No PR is created in this mode')
    expect(content).not.toContain('gh pr list --repo {owner}/{repo} --state merged')
    expect(content).not.toContain('az repos pr list --repository {repo} --status completed')
  })

  it('patches archive-plan for gitlab platform', async () => {
    const source = path.join(process.cwd(), 'content', '.opencode', 'commands', 'archive-plan.md')
    const dest = path.join(tmpDir, '.opencode', 'commands', 'archive-plan.md')
    await fse.ensureDir(path.dirname(dest))
    await fse.copyFile(source, dest)

    await patchArchiveCommand('gitlab', tmpDir)

    const content = await fse.readFile(dest, 'utf-8')
    // glab has no `--state merged` / `--json <fields>` — the preset uses the
    // real syntax (`--merged --output json`); keep this assertion in sync.
    expect(content).toContain('glab mr list --repo {owner}/{repo} --merged --output json')
    expect(content).toContain('glab mr create')
    expect(content).not.toContain('gh pr list --repo {owner}/{repo} --state merged')
    expect(content).not.toContain('az repos pr list --repository {repo} --status completed')
  })
})

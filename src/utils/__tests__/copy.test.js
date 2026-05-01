import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import os from 'os'
import fse from 'fs-extra'

// Use real fs-extra for file system tests (temp dirs)
import { copyContent, findAiFiles } from '../copy.js'

const tmpDir = () => fse.mkdtempSync(path.join(os.tmpdir(), 'ob-test-'))

describe('copy utils', () => {
  describe('findAiFiles()', () => {
    let dir

    beforeEach(() => {
      dir = tmpDir()
    })

    afterEach(async () => {
      await fse.remove(dir)
    })

    it('returns empty array when no AI files exist', async () => {
      const found = await findAiFiles(dir)
      expect(found).toEqual([])
    })

    it('detects AGENTS.md', async () => {
      await fse.writeFile(path.join(dir, 'AGENTS.md'), '# agents')
      const found = await findAiFiles(dir)
      expect(found).toHaveLength(1)
      expect(found[0]).toContain('AGENTS.md')
    })

    it('detects CLAUDE.md', async () => {
      await fse.writeFile(path.join(dir, 'CLAUDE.md'), '# claude')
      const found = await findAiFiles(dir)
      expect(found).toHaveLength(1)
      expect(found[0]).toContain('CLAUDE.md')
    })

    it('detects multiple AI files at once', async () => {
      await fse.writeFile(path.join(dir, 'AGENTS.md'), '')
      await fse.writeFile(path.join(dir, '.cursorrules'), '')
      await fse.writeFile(path.join(dir, '.clinerules'), '')
      const found = await findAiFiles(dir)
      expect(found).toHaveLength(3)
    })

    it('detects nested copilot-instructions.md', async () => {
      const ghDir = path.join(dir, '.github')
      await fse.ensureDir(ghDir)
      await fse.writeFile(path.join(ghDir, 'copilot-instructions.md'), '')
      const found = await findAiFiles(dir)
      expect(found).toHaveLength(1)
      expect(found[0]).toContain('copilot-instructions.md')
    })
  })

  describe('copyContent()', () => {
    let src, dest

    beforeEach(async () => {
      src = tmpDir()
      dest = tmpDir()
    })

    afterEach(async () => {
      await fse.remove(src)
      await fse.remove(dest)
    })

    it('copies files that match neither platform exclusion', async () => {
      await fse.writeFile(path.join(src, 'AGENTS.md'), '# agents')
      await copyContent(src, dest, 'github')
      expect(await fse.pathExists(path.join(dest, 'AGENTS.md'))).toBe(true)
    })

    it('excludes azure files when platform is github', async () => {
      await fse.ensureDir(path.join(src, 'skills', 'ob-userstory-az'))
      await fse.writeFile(path.join(src, 'skills', 'ob-userstory-az', 'SKILL.md'), 'azure skill')
      await fse.writeFile(path.join(src, 'agent-az.md'), 'azure agent')

      await copyContent(src, dest, 'github')

      expect(await fse.pathExists(path.join(dest, 'agent-az.md'))).toBe(false)
      expect(await fse.pathExists(path.join(dest, 'skills', 'ob-userstory-az', 'SKILL.md'))).toBe(false)
    })

    it('excludes github files when platform is azure', async () => {
      await fse.ensureDir(path.join(src, 'skills', 'ob-userstory-gh'))
      await fse.writeFile(path.join(src, 'skills', 'ob-userstory-gh', 'SKILL.md'), 'gh skill')
      await fse.writeFile(path.join(src, 'agent-gh.md'), 'gh agent')

      await copyContent(src, dest, 'azure')

      expect(await fse.pathExists(path.join(dest, 'agent-gh.md'))).toBe(false)
      expect(await fse.pathExists(path.join(dest, 'skills', 'ob-userstory-gh', 'SKILL.md'))).toBe(false)
    })

    it('always excludes .bootstrap folder', async () => {
      await fse.ensureDir(path.join(src, '.bootstrap'))
      await fse.writeFile(path.join(src, '.bootstrap', 'secret.md'), 'internal')

      await copyContent(src, dest, 'github')

      expect(await fse.pathExists(path.join(dest, '.bootstrap', 'secret.md'))).toBe(false)
    })

    it('does not overwrite existing files', async () => {
      await fse.writeFile(path.join(src, 'AGENTS.md'), 'new content')
      await fse.writeFile(path.join(dest, 'AGENTS.md'), 'original content')

      await copyContent(src, dest, 'github')

      const content = await fse.readFile(path.join(dest, 'AGENTS.md'), 'utf-8')
      expect(content).toBe('original content')
    })

    it('copies github-specific files when platform is github', async () => {
      await fse.writeFile(path.join(src, 'agent-gh.md'), 'github agent')
      await copyContent(src, dest, 'github')
      expect(await fse.pathExists(path.join(dest, 'agent-gh.md'))).toBe(true)
    })

    it('copies azure-specific files when platform is azure', async () => {
      await fse.writeFile(path.join(src, 'agent-az.md'), 'azure agent')
      await copyContent(src, dest, 'azure')
      expect(await fse.pathExists(path.join(dest, 'agent-az.md'))).toBe(true)
    })
  })
})

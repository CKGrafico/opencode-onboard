// Integration tests that run the install-time patchers against the REAL
// content/ templates. The unit tests mock the filesystem and preset layers,
// which is exactly where src/ and content/ have historically drifted apart
// (heading renames, skill gating, double-escaped preset strings). These tests
// fail the moment either side changes shape without the other.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

vi.mock('execa', () => ({ execa: vi.fn().mockResolvedValue({ exitCode: 0 }) }))
vi.mock('../../utils/exec.js')

import { patchAgentsMd, patchAgentGuidance, skipStepBlock } from './agents.js'
import { installSkills } from './skills.js'
import { resolvePlatform } from '../../commands/single.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../../../content')
const REAL_AGENTS_MD = fs.readFileSync(path.join(CONTENT_DIR, 'AGENTS.md'), 'utf-8')

let tmpDir

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onboard-integration-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('patchAgentsMd against the real content/AGENTS.md', () => {
  it('marks all three bootstrap steps as skipped when the files already exist', async () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), REAL_AGENTS_MD)

    await patchAgentsMd({ hasOpenspec: true, hasDesign: true, hasArchitecture: true })

    const patched = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')
    // Headings survive (numbering stays stable for cross-references)...
    expect(patched).toMatch(/#{3,4} Step \d+, Archive project history into OpenSpec/)
    expect(patched).toMatch(/#{3,4} Step \d+, Generate DESIGN\.md/)
    expect(patched).toMatch(/#{3,4} Step \d+, Generate ARCHITECTURE\.md/)
    // ...but each body is replaced by an explicit skip note.
    expect(patched.match(/Skipped during onboarding/g)).toHaveLength(3)
    // The step instructions themselves are gone.
    expect(patched).not.toContain('openspec new change "project-history"')
    expect(patched).not.toContain('Run `/ob-create-design` now.')
    expect(patched).not.toContain('Run `/ob-create-architecture` now.')
    // Confirm-banner lines for the skipped steps are removed.
    expect(patched).not.toContain('- Project history archived in openspec')
    expect(patched).not.toContain('- DESIGN.md generated')
    expect(patched).not.toContain('- ARCHITECTURE.md generated')
  })

  it('every step title the patcher targets exists in the template (drift guard)', () => {
    for (const title of [
      'Archive project history into OpenSpec',
      'Generate DESIGN.md',
      'Generate ARCHITECTURE.md',
    ]) {
      const { matched } = skipStepBlock(REAL_AGENTS_MD, title, 'x')
      expect(matched, `step "${title}" not found in content/AGENTS.md`).toBe(true)
    }
  })

  it('leaves the file untouched when nothing exists yet', async () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), REAL_AGENTS_MD)
    await patchAgentsMd({})
    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toBe(REAL_AGENTS_MD)
  })
})

describe('patchAgentGuidance mixed platforms against the real template', () => {
  it.each([
    ['azure', 'github'],
    ['jira', 'gitlab'],
    ['browser', 'azure'],
    ['github', 'gitlab'],
  ])('backlog=%s repo=%s injects clean text with intact markers', async (backlog, repo) => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), REAL_AGENTS_MD)

    await patchAgentGuidance(backlog, repo, tmpDir)

    const patched = fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')
    // No double-escaped preset strings may ever reach the installed file.
    expect(patched).not.toContain('\\n')
    // Markers must survive so optimization re-runs can re-patch.
    for (const marker of [
      'OB-PLATFORM-WORKFLOW-START', 'OB-PLATFORM-WORKFLOW-END',
      'OB-PLATFORM-PIPELINE-START', 'OB-PLATFORM-PIPELINE-END',
      'OB-RTK-START',
    ]) {
      expect(patched).toContain(marker)
    }
  })
})

describe('installSkills platform gating (real content/.agents/skills)', () => {
  async function installedSkill(name) {
    const p = path.join(tmpDir, '.agents', 'skills', name, 'SKILL.md')
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null
  }

  it('azure backlog + gitlab repo → azure userstory, gitlab pullrequest', async () => {
    await installSkills('azure', 'gitlab')
    expect(await installedSkill('ob-userstory')).toContain('az boards work-item show')
    expect(await installedSkill('ob-pullrequest')).toContain('glab mr create')
  })

  it('jira backlog + github repo → jira userstory, github pullrequest', async () => {
    await installSkills('jira', 'github')
    expect(await installedSkill('ob-userstory')).toContain('acli jira workitem view')
    expect(await installedSkill('ob-pullrequest')).toContain('gh pr create')
  })

  it('github backlog + none repo → github userstory, NO pullrequest skill', async () => {
    await installSkills('github', 'none')
    expect(await installedSkill('ob-userstory')).toContain('gh issue view')
    expect(await installedSkill('ob-pullrequest')).toBeNull()
  })

  it('browser backlog + azure repo → browser userstory, azure pullrequest', async () => {
    await installSkills('browser', 'azure')
    expect(await installedSkill('ob-userstory')).toContain('browser_open_tab')
    expect(await installedSkill('ob-pullrequest')).toContain('az repos pr create')
  })
})

describe('resolvePlatform accepts every platforms.json value', () => {
  it.each(['github', 'azure', 'jira', 'gitlab', 'browser', 'none'])('keeps %s', value => {
    expect(resolvePlatform(value)).toBe(value)
  })

  it('falls back to github for unknown/missing values', () => {
    expect(resolvePlatform('bitbucket')).toBe('github')
    expect(resolvePlatform(undefined)).toBe('github')
  })
})

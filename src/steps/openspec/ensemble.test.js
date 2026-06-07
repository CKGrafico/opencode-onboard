import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { patchApplyFile, APPLY_TARGETS, ENSEMBLE_SECTION } from './ensemble.js'

describe('patchApplyFile()', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns ok:false when file does not exist', async () => {
    const result = await patchApplyFile(path.join(tmpDir, 'missing.md'))

    expect(result).toEqual({ ok: false, reason: 'missing-file' })
  })

  it('returns ok:false when Step 6 is not found', async () => {
    const filePath = path.join(tmpDir, 'opsx-apply.md')
    fs.writeFileSync(filePath, 'Some other content without Step 6', 'utf-8')

    const result = await patchApplyFile(filePath)

    expect(result).toEqual({ ok: false, reason: 'missing-step-6' })
  })

  it('patches file with ENSEMBLE_SECTION when Step 6 found', async () => {
    const filePath = path.join(tmpDir, 'opsx-apply.md')
    const original = `Some header

6. **Implement**
   Old implementation here.

**Fluid Workflow Integration**
   Fluid section content.
`
    fs.writeFileSync(filePath, original, 'utf-8')

    const result = await patchApplyFile(filePath)

    expect(result.ok).toBe(true)
    const patched = fs.readFileSync(filePath, 'utf-8')
    expect(patched).toContain('**Implement via ensemble team**')
    expect(patched).toContain('6. **Implement via ensemble team**')
    expect(patched).toContain('**Fluid Workflow Integration**')
  })

  it('removes original Step 6 content before patching', async () => {
    const filePath = path.join(tmpDir, 'SKILL.md')
    const original = `Steps:

6. **Implement**
   Do things directly.

7. **Quality check**
`
    fs.writeFileSync(filePath, original, 'utf-8')

    await patchApplyFile(filePath)

    const patched = fs.readFileSync(filePath, 'utf-8')
    expect(patched).not.toContain('Do things directly.')
    expect(patched).toContain('NEVER implement tasks directly')
  })
})

describe('APPLY_TARGETS', () => {
  it('contains expected OpenSpec apply file paths', () => {
    expect(APPLY_TARGETS).toHaveLength(2)
    expect(APPLY_TARGETS).toContain(path.join('.opencode', 'commands', 'opsx-apply.md'))
    expect(APPLY_TARGETS).toContain(path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'))
  })
})

describe('ENSEMBLE_SECTION dependency guidance', () => {
  it('instructs multi-call task creation for dependent tasks', () => {
    expect(ENSEMBLE_SECTION).toContain('using as many `team_tasks_add` calls as needed')
    expect(ENSEMBLE_SECTION).toContain('Save the returned IDs for root tasks.')
    expect(ENSEMBLE_SECTION).toContain('Repeat until every OpenSpec task is on the board')
  })

  it('requires claim_task and idle-teammate recovery guidance', () => {
    expect(ENSEMBLE_SECTION).toContain('ALWAYS set \`claim_task\` to the first unblocked task')
    expect(ENSEMBLE_SECTION).toContain('If the teammate is idle and has not claimed any assigned task')
    expect(ENSEMBLE_SECTION).toContain('stop forcing ensemble for this change and continue in the main session')
  })

  it('prefers discovered custom engineers over hardcoded role inventory', () => {
    expect(ENSEMBLE_SECTION).toContain('scan `.agents/agents/` and list the engineers that actually exist in this project')
    expect(ENSEMBLE_SECTION).toContain('prefer the most specialized custom engineer')
    expect(ENSEMBLE_SECTION).not.toContain('front-engineer: UI, components, framework skills')
    expect(ENSEMBLE_SECTION).not.toContain('team_spawn name:"front" agent:"front-engineer"')
  })

  it('keeps the prompt claim-first and minimal', () => {
    expect(ENSEMBLE_SECTION).toContain('Claim this task immediately as your first action:')
    expect(ENSEMBLE_SECTION).toContain('After claiming:')
    expect(ENSEMBLE_SECTION).not.toContain('Available OpenCode tools:')
  })

  it('does not include the impossible same-call dependency example', () => {
    expect(ENSEMBLE_SECTION).not.toContain('{ content: "3.1 <task that needs 1.x done first>", priority: "medium", depends_on: ["<id-of-1.1>"] }')
    expect(ENSEMBLE_SECTION).not.toContain('Use depends_on to block tasks that require other tasks first, pass the IDs returned by team_tasks_add.')
  })
})

import fse from 'fs-extra'
import path from 'path'
import { info, success } from '../../utils/exec.js'

const STEP1_HEADING = '### Step 1, Archive project history into OpenSpec'
const STEP2_HEADING = '### Step 2, Generate DESIGN.md'
const STEP3_HEADING = '### Step 3, Generate ARCHITECTURE.md'

const STEP1_CONFIRM_LINE = '- Project history archived in openspec'
const STEP2_CONFIRM_LINE = '- DESIGN.md generated'
const STEP3_CONFIRM_LINE = '- ARCHITECTURE.md generated'

function removeStepBlock(content, heading) {
  const lines = content.split('\n')
  const start = lines.findIndex(l => l.trim() === heading.trim())
  if (start === -1) return content

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break }
  }

  if (end === -1) return content

  const removeFrom = start > 0 && lines[start - 1].trim() === '' ? start - 1 : start
  lines.splice(removeFrom, end - removeFrom + 1)
  return lines.join('\n')
}

function removeConfirmLine(content, line) {
  return content.split('\n').filter(l => l.trim() !== line.trim()).join('\n')
}

function renumberSteps(content) {
  let counter = 0
  return content.replace(/^### Step \d+,/gm, () => `### Step ${++counter},`)
}

const PLATFORM_SKILLS_START = '<!-- OB-PLATFORM-SKILLS-START -->'
const PLATFORM_SKILLS_END = '<!-- OB-PLATFORM-SKILLS-END -->'
const PLATFORM_MODE_START = '<!-- OB-PLATFORM-MODE-START -->'
const PLATFORM_MODE_END = '<!-- OB-PLATFORM-MODE-END -->'
const PLATFORM_WORKFLOW_START = '<!-- OB-PLATFORM-WORKFLOW-START -->'
const PLATFORM_WORKFLOW_END = '<!-- OB-PLATFORM-WORKFLOW-END -->'
const PLATFORM_PIPELINE_START = '<!-- OB-PLATFORM-PIPELINE-START -->'
const PLATFORM_PIPELINE_END = '<!-- OB-PLATFORM-PIPELINE-END -->'

function buildPlatformSkillsSection(platform) {
  if (platform === 'none') {
    return [
      '- Selected platform: `none` (from onboarding platform step).',
      '- Do NOT load `ob-userstory-gh`, `ob-userstory-az`, `ob-pullrequest-gh`, or `ob-pullrequest-az`.',
      '- Work only from direct user instructions in the main conversation or from local OpenSpec artifacts.',
      '- Ignore GitHub/Azure DevOps URL inference unless the user explicitly reconfigures onboarding later.',
    ].join('\n')
  }

  if (platform === 'azure') {
    return [
      '- Selected platform: `azure` (from onboarding platform step).',
      '- Load Azure DevOps skills: `ob-userstory-az`, `ob-pullrequest-az`.',
      '- Use URL-based platform inference only if onboarding metadata is missing or ambiguous.',
    ].join('\n')
  }

  return [
    '- Selected platform: `github` (from onboarding platform step).',
    '- Load GitHub skills: `ob-userstory-gh`, `ob-pullrequest-gh`.',
    '- Use URL-based platform inference only if onboarding metadata is missing or ambiguous.',
  ].join('\n')
}

function buildPlatformModeSection(platform) {
  if (platform === 'none') {
    return 'This project does not use GitHub or Azure DevOps integration. Do not read work items, create PRs, or process PR feedback. Operate only from direct user instructions and local repository context.'
  }

  return 'This project uses platform-integrated workflow modes described below.'
}

function buildLeadWorkflowSection(platform) {
  if (platform === 'none') {
    return [
      'When the user gives a task directly in the conversation, **I own the full lifecycle**. I load `ob-global` first, then work from the user request and local repository context. I may use OpenSpec when structured planning helps, but I do not depend on issue links or PR workflows.',
      '',
      'Trigger patterns, I recognize ALL of these, exact wording does not matter:',
      '- User describes a feature, bug, or refactor directly → clarify if needed → optionally run `/opsx-propose` → implement in the main session or `/opsx-apply` as appropriate',
      '- `implement the plan` / `implement` / `start` / `go` → run `/opsx-apply` against the current OpenSpec change when one exists',
      '- `just do it` / `quick fix` / `raw conversation` → work directly in the main session without PR or work-item automation',
      '',
      '**GitHub Issue URLs, Azure DevOps work item URLs, and PR URLs are NOT automatic triggers in this mode.** Only use platform-specific flows if onboarding is later reconfigured for GitHub or Azure DevOps.',
    ].join('\n')
  }

  return [
    'When the user provides a work item URL or says "implement the plan" or "I\'ve added comments to the PR", **I own the full lifecycle**. I load `ob-global` skill first, then the appropriate userstory skill, and use ensemble tools to coordinate the agent team.',
    '',
    'Trigger patterns, I recognize ALL of these, exact wording does not matter:',
    platform === 'azure'
      ? '- User pastes or mentions an Azure DevOps URL → load `ob-userstory-az` skill → parse work item → run `/opsx-propose` → confirm with user → run `/opsx-apply` → ship'
      : '- User pastes or mentions a GitHub Issue URL → load `ob-userstory-gh` skill → parse issue → run `/opsx-propose` → confirm with user → run `/opsx-apply` → ship',
    '- `implement the plan` / `implement` / `start` / `go` → run `/opsx-apply` → ship',
    '- `I\'ve added comments to the PR` → read PR comments → fix → update PR',
    platform === 'azure'
      ? '- Any Azure DevOps PR URL in a feedback/fix request (e.g. "check comments", "fix PR feedback") → run PR Feedback Loop'
      : '- Any GitHub PR URL in a feedback/fix request (e.g. "check comments", "fix PR feedback") → run PR Feedback Loop',
    '',
    platform === 'azure'
      ? '**An Azure DevOps URL anywhere in the user\'s message is always a trigger, regardless of surrounding words.**'
      : '**A GitHub URL anywhere in the user\'s message is always a trigger, regardless of surrounding words.**',
  ].join('\n')
}

function buildPipelineSection(platform) {
  if (platform === 'none') {
    return [
      '```',
      'main session (lead mode)',
      '  → load ob-global + understand direct user request',
      '        ↓',
      '  optional openspec-propose',
      '  → proposal.md + specs + tasks when structured planning helps',
      '        ↓',
      '  [confirm with user when scope needs it]',
      '        ↓',
      'basic-engineer + custom-engineer-* (parallel as needed)',
      '  → claim tasks + load abilities + implement',
      '        ↓',
      'main session',
      '  → verify completion → summarize results to user',
      '```',
      '',
      '### Phase 1, Clarify & Plan',
      '',
      '```',
      '1. Load `ob-global`.',
      '2. Understand the task directly from the conversation and local repo context.',
      '3. If the work benefits from explicit specs/tasks, run `/opsx-propose` or create/update OpenSpec artifacts.',
      '4. Show the plan or intended scope when the work is non-trivial.',
      '5. If the request is small and clear, implementation can begin directly in the main session.',
      '```',
      '',
      '### Phase 2, Implement',
      '',
      '```',
      '0. Run `/quota` to check remaining budget before spawning, when available.',
      '1. If using OpenSpec tasks, run `/opsx-apply`.',
      '   - Step 5b: classify cost tier, announce scope, ask user to confirm if ≥4 tasks.',
      '   - Lead adds all tasks to board.',
      '   - When dependencies exist, lead uses multiple `team_tasks_add` waves so later tasks can reference real task IDs returned by earlier waves.',
      '   - Lead discovers available engineers from `.agents/agents/*.md`, prefers matching custom engineers, then spawns engineers with initial batch of up to 3 tasks each (rolling batch model).',
      '   - Each engineer claims tasks, implements, completes, messages lead.',
      '   - Lead assigns next batch (up to 3) to agents that report done. Repeat until board empty.',
      '   - Lead merges each engineer branch after shutdown, then marks tasks done in tasks.md.',
      '2. If the task is small and no OpenSpec plan is needed, implement directly in the main session instead.',
      '3. Verify with tests/build/lint according to task scope.',
      '```',
      '',
      'There is no PR shipping phase and no PR feedback loop in `none` mode. Report completion directly to the user in the main conversation.',
    ].join('\n')
  }

  const phase1Line = platform === 'azure'
    ? '1. Detect URL type → load matching skill (`ob-userstory-az`)'
    : '1. Detect URL type → load matching skill (`ob-userstory-gh`)'
  const prFlow = platform === 'azure'
    ? '3. team_spawn name:devops agent:devops-manager (ship mode)\n   → commit & push → create PR → post comment'
    : '3. team_spawn name:devops agent:devops-manager (ship mode)\n   → commit & push → create PR → post comment'

  return [
    '```',
    'devops-manager (lead mode)',
    '  → load ob-global + parse work item via skill',
    '        ↓',
    '  openspec-propose',
    '  → proposal.md + specs + tasks',
    '        ↓',
    '  [confirm with user]',
    '        ↓',
    'basic-engineer + custom-engineer-* (parallel as needed)',
    '  → claim tasks + load abilities + implement',
    '        ↓',
    'devops-manager (ship mode)',
    '  → verify completion → commit → push → PR → post comment',
    '```',
    '',
    '### Phase 1, Parse & Propose',
    '',
    '```',
    phase1Line,
    '2. Follow skill steps: fetch issue/work item via CLI, create OpenSpec change',
    '3. Run /opsx-propose → generates proposal.md, specs/, design.md, tasks.md',
    '4. Show the plan: change name, total tasks, task list summary',
    '5. STOP. Ask user: "Ready to implement? (yes/no)", DO NOT proceed until confirmed.',
    '```',
    '',
    '### Phase 2, Implement',
    '',
    '```',
    '0. Run /quota to check remaining budget before spawning.',
    '1. Run /opsx-apply.',
    '   - Step 5b: classify cost tier, announce scope, ask user to confirm if ≥4 tasks.',
    '   - Lead adds all tasks to board.',
    '   - When dependencies exist, lead uses multiple `team_tasks_add` waves so later tasks can reference real task IDs returned by earlier waves.',
    '   - Lead discovers available engineers from `.agents/agents/*.md`, prefers matching custom engineers, then spawns engineers with initial batch of up to 3 tasks each (rolling batch model).',
    '   - Each engineer claims tasks, implements, completes, messages lead.',
    '   - Lead assigns next batch (up to 3) to agents that report done. Repeat until board empty.',
    '   - Lead merges each engineer branch after shutdown, then marks tasks done in tasks.md.',
    '2. Verify with tests/build/lint according to task scope.',
    '3. Run /quota after all agents are merged.',
    '```',
    '',
    '### Phase 3, Ship',
    '',
    '```',
    prFlow,
    '4. Wait → team_results → report PR URL to user',
    '5. team_cleanup',
    '```',
    '',
    '### Phase 4, PR Feedback Loop',
    '',
    '```',
    'When user says "I\'ve added comments to the PR" or asks to fix PR comments from PR URLs:',
    '1. team_create "pr-feedback-<id>-<random>"',
    '2. team_tasks_add with at least these lead-managed tasks:',
    '   - Parse and classify PR feedback (devops-manager)',
    '   - Implement feedback items (basic-engineer and/or custom engineers)',
    '   - Verify with tests/build/lint (implementation worker or dedicated verifier if available)',
    '   - Push updates and post PR replies (devops-manager)',
    '3. team_spawn devops-manager (feedback mode) with explicit task IDs, then team_message "Start now"',
    '4. Wait for message → team_results',
    '5. Add/update implementation tasks on board, then spawn needed engineers in parallel with explicit task IDs + team_message "Start now"',
    '6. Wait for engineer results → team_shutdown + team_merge per engineer',
    '7. Run verification tasks (tests/build/lint) and fix blockers if any',
    '8. team_spawn devops-manager (ship mode) with "push + update PR threads" task ID + team_message "Start now"',
    '9. Wait → team_results → report what was updated',
    '10. team_cleanup',
    '```',
  ].join('\n')
}

function replaceBetween(content, start, end, replacement) {
  if (!content.includes(start) || !content.includes(end)) return content
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  return content.replace(pattern, `${start}\n${replacement.trim()}\n${end}`)
}

const CONCURRENCY_PLACEHOLDER = '{{MAX_CONCURRENT_AGENTS}}'
const DEFAULT_MAX_CONCURRENT_AGENTS = 4

export async function patchConcurrency(ctx) {
  const maxAgents = String(ctx.maxConcurrentAgents ?? DEFAULT_MAX_CONCURRENT_AGENTS)
  const cwd = process.cwd()

  const filesToPatch = [
    'AGENTS.md',
    path.join('.opencode', 'commands', 'opsx-apply.md'),
    path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
  ]

  let patched = 0
  for (const rel of filesToPatch) {
    const abs = path.join(cwd, rel)
    if (!await fse.pathExists(abs)) continue
    const content = await fse.readFile(abs, 'utf-8')
    if (!content.includes(CONCURRENCY_PLACEHOLDER)) continue
    await fse.writeFile(abs, content.replaceAll(CONCURRENCY_PLACEHOLDER, maxAgents), 'utf-8')
    patched++
  }

  if (patched > 0) {
    success(`Concurrency limit set to ${maxAgents} agents in ${patched} file(s)`)
  }
}

export async function patchAgentsMd(ctx) {
  const agentsMdPath = path.join(process.cwd(), 'AGENTS.md')
  if (!await fse.pathExists(agentsMdPath)) return

  let content = await fse.readFile(agentsMdPath, 'utf-8')
  const patches = []

  if (ctx.hasOpenspec) {
    content = removeStepBlock(content, STEP1_HEADING)
    content = removeConfirmLine(content, STEP1_CONFIRM_LINE)
    patches.push('Step 1 (openspec history) removed, openspec/ already exists')
  }

  if (ctx.hasDesign) {
    content = removeStepBlock(content, STEP2_HEADING)
    content = removeConfirmLine(content, STEP2_CONFIRM_LINE)
    patches.push('Step 2 (DESIGN.md) removed, DESIGN.md already exists')
  }

  if (ctx.hasArchitecture) {
    content = removeStepBlock(content, STEP3_HEADING)
    content = removeConfirmLine(content, STEP3_CONFIRM_LINE)
    patches.push('Step 3 (ARCHITECTURE.md) removed, ARCHITECTURE.md already exists')
  }

  if (patches.length > 0) {
    content = renumberSteps(content)
    await fse.writeFile(agentsMdPath, content, 'utf-8')
    for (const msg of patches) info(msg)
    success('AGENTS.md patched for existing project state')
  }
}

export async function patchAgentGuidance(platform, cwd = process.cwd()) {
  const agentsMdPath = path.join(cwd, 'AGENTS.md')
  if (await fse.pathExists(agentsMdPath)) {
    let content = await fse.readFile(agentsMdPath, 'utf-8')
    content = replaceBetween(content, PLATFORM_WORKFLOW_START, PLATFORM_WORKFLOW_END, buildLeadWorkflowSection(platform))
    content = replaceBetween(content, PLATFORM_PIPELINE_START, PLATFORM_PIPELINE_END, buildPipelineSection(platform))
    await fse.writeFile(agentsMdPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
    success(`AGENTS.md patched for platform workflow: ${platform}`)
  }
}

export async function patchDevopsManagerMd(platform, cwd = process.cwd()) {
  const devopsPath = path.join(cwd, '.agents', 'agents', 'devops-manager.md')
  if (!await fse.pathExists(devopsPath)) return

  const resolved = platform === 'azure' ? 'azure' : platform === 'none' ? 'none' : 'github'
  let content = await fse.readFile(devopsPath, 'utf-8')
  content = replaceBetween(content, PLATFORM_SKILLS_START, PLATFORM_SKILLS_END, buildPlatformSkillsSection(resolved))
  content = replaceBetween(content, PLATFORM_MODE_START, PLATFORM_MODE_END, buildPlatformModeSection(resolved))
  await fse.writeFile(devopsPath, `${content.replace(/\s*$/, '')}\n`, 'utf-8')
  success(`devops-manager.md patched for platform: ${resolved}`)
}

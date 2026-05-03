import { execa } from 'execa'
import fs from 'node:fs'
import path from 'node:path'
import { error, header, success, warn } from '../utils/exec.js'

const ENSEMBLE_PATCH = `6. **Implement via ensemble team**

   NEVER implement tasks directly. Always delegate to specialists via ensemble.
   Do NOT touch any source files before the team is running, not even a single edit.

   a. Create feature branch if not already on one: \`feature/{id}-{slug}\`

   b. Clean up any stale team state, then create the team:
      \`\`\`
      team_cleanup force:true acknowledge_uncommitted:true   (ignore "not in a team" errors)
      team_create "<change-name>"
      \`\`\`
      Announce: "Team running. Monitor at http://localhost:4747/"

   c. Add all tasks to the shared board so progress is visible in the dashboard:
      \`\`\`
      team_tasks_add tasks:[
        { title: "1.1 <task>", assignee: "back" },
        { title: "1.2 <task>", assignee: "back" },
        ...one entry per task from the tasks.md checklist...
        { title: "4.1 <task>", assignee: "front" },
        ...
      ]
      \`\`\`

   d. Spawn only the specialists the tasks require (in parallel). Include the FULL task list and ALL context file paths directly in each spawn prompt, agents start working immediately:
      \`\`\`
      team_spawn name:front  agent:front-engineer  prompt:"<full task list + context file paths + architecture notes + use team_tasks_complete to mark each task done + report back when done or blocked>"
      team_spawn name:back   agent:back-engineer   prompt:"<full task list + context file paths + architecture notes + use team_tasks_complete to mark each task done + report back when done or blocked>"
      team_spawn name:infra  agent:infra-engineer  prompt:"<full task list + context file paths + architecture notes + use team_tasks_complete to mark each task done + report back when done or blocked>"
      \`\`\`

   e. Wait for all → \`team_results\` → \`team_shutdown\` + \`team_merge\`

7. **Quality check**

   \`\`\`
   team_spawn name:quality agent:quality-engineer prompt:"<task list, context files, run tests + build + lint + verify acceptance criteria, use team_tasks_complete for each verified item, report back when done>"
   \`\`\`
   Wait → \`team_results\` → fix blockers → \`team_shutdown\`

8. **Mark tasks complete in openspec**

   After specialists finish, update the tasks file: \`- [ ]\` → \`- [x]\` for each completed task.
   Run \`openspec status --change "<name>" --json\` to confirm progress.

9. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive with \`/opsx-archive\`
   - If paused: explain why and wait for guidance

   Then run \`team_cleanup\`.

**Guardrails**
- NEVER implement tasks directly. Always use \`team_create\` + \`team_spawn\`, no exceptions
- NEVER touch source files before \`team_create\` is called, not even one edit
- ALWAYS run \`team_cleanup force:true\` before \`team_create\` to clear stale state from previous runs
- ALWAYS add tasks to the board with \`team_tasks_add\` before spawning so the dashboard shows progress
- ALWAYS include the full task list and context file paths in the spawn prompt. Agents must start working immediately, never tell them to "wait for a message"
- ALWAYS tell spawned agents to call \`team_tasks_complete\` as they finish each task
- "Small feature", "faster to do it directly", "environment issues", "teammates not responding" are NOT valid reasons to implement directly. If teammates are stuck, use \`team_message\` to resend tasks, then wait
- Always read context files before spawning (from the apply instructions output)
- Mark tasks complete in openspec AFTER specialists finish, not before
- If task is ambiguous, pause and ask before spawning
- If implementation reveals issues, pause and suggest artifact updates
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file names
`

// Patterns that identify the solo implementation step in openspec-generated files
const SOLO_IMPL_PATTERNS = [
  /^#{1,3}\s+\d+\..*(implement|loop until|make the code changes|for each (pending )?task)/im,
  /\*\*Implement tasks.*loop until/im,
  /^6\.\s+\*\*Implement tasks/im,
]

function patchOpensxApply(filePath) {
  if (!fs.existsSync(filePath)) return false

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  // Find the line index where the solo implementation step starts
  let cutLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (SOLO_IMPL_PATTERNS.some(p => p.test(lines[i]))) {
      cutLine = i
      break
    }
  }

  if (cutLine === -1) return false // Pattern not found, skip

  const preamble = lines.slice(0, cutLine).join('\n').trimEnd()
  const patched = preamble + '\n\n' + ENSEMBLE_PATCH
  fs.writeFileSync(filePath, patched, 'utf8')
  return true
}

export async function initOpenspec() {
  header('Step 6, Initializing OpenSpec')

  try {
    const result = await execa('npx', ['@fission-ai/openspec', 'init', '--tools', 'opencode', '--force'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      reject: false,
    })

    if (result.exitCode === 0) {
      success('OpenSpec initialized')
    } else {
      warn('OpenSpec init exited with non-zero code, check output above')
    }
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`)
  }

  // Patch opsx-apply.md to use ensemble orchestration instead of solo implementation
  const targets = [
    path.join(process.cwd(), '.opencode', 'commands', 'opsx-apply.md'),
    path.join(process.cwd(), '.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
  ]

  for (const target of targets) {
    try {
      const patched = patchOpensxApply(target)
      if (patched) success(`Patched ${path.relative(process.cwd(), target)} for ensemble`)
    } catch (err) {
      warn(`Could not patch ${path.relative(process.cwd(), target)}: ${err.message}`)
    }
  }
}


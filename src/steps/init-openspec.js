import { execa } from 'execa'
import fs from 'node:fs'
import path from 'node:path'
import { error, header, success, warn } from '../utils/exec.js'

const ENSEMBLE_PATCH = `6. **Implement via ensemble team**

   NEVER implement tasks directly. Always delegate to specialists via ensemble.
   Do NOT touch any source files before the team is running, not even a single edit.

   Steps MUST be followed in order. Do not skip any step.

   **Step 6a.** Create feature branch if not already on one: \`feature/{id}-{slug}\`

   **Step 6b.** Clean up stale state, then create the team:
      \`\`\`
      team_cleanup force:true acknowledge_uncommitted:true
      team_create "<change-name>"
      \`\`\`
      "not in a team" error from team_cleanup is expected, ignore it.
      Announce: "Team running. Monitor at http://localhost:4747/"

   **Step 6c.** Add ALL tasks to the shared board BEFORE spawning anyone.
      Schema: { content: string, priority: "high"|"medium"|"low", depends_on?: string[] }
      Use depends_on to block tasks that require other tasks first — pass the IDs returned by team_tasks_add.
      \`\`\`
      team_tasks_add tasks:[
        { content: "1.1 <exact task text from tasks.md>", priority: "high" },
        { content: "1.2 <exact task text>", priority: "high" },
        { content: "3.1 <task that needs 1.x done first>", priority: "medium", depends_on: ["<id-of-1.1>"] },
        ...every task from tasks.md, one entry each...
      ]
      \`\`\`
      Save the task IDs returned. Pass them to agents in step 6d.
      DO NOT call team_claim yourself — only agents claim tasks.
      DO NOT proceed to 6d until team_tasks_add succeeds.

   **Step 6d.** Spawn specialists ONE AT A TIME. Wait for each team_spawn result before calling the next.
      Each team_spawn MUST include agent field (required, causes NOT NULL error if omitted).

      The spawn prompt must contain exactly:
      1. Their name and role on this team
      2. Which tasks are theirs — list the task IDs and content from the board
      3. Key context they need (summarized from context files — do NOT tell them to read files themselves)
      4. The 6 tools they can use, one line each: team_message, team_broadcast, team_tasks_list, team_tasks_add, team_tasks_complete, team_claim
      5. How to proceed: use team_claim to claim a task before starting it, team_tasks_complete after finishing it, repeat until all their tasks are done, then team_message lead with results or blockers

      Keep spawn prompts under 500 tokens. Do not describe team internals or how ensemble works.
      \`\`\`
      team_spawn name:"back" agent:"back-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"front" agent:"front-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"infra" agent:"infra-engineer" prompt:"..."
      (wait for result)
      \`\`\`

   **Step 6e.** After all spawns, tell the user what is running, then STOP and wait.
      Do NOT call team_results, team_status, or team_broadcast in a loop.
      Teammates will message you when done or blocked. Wait for those messages.

   **Step 6f.** When a teammate messages back, you receive a ping only — the full content is NOT in the notification.
      Call team_results to read the full message and mark it read. Then for each teammate: team_shutdown → team_merge.
      If team_merge blocks ("overlapping local changes"), commit or stash your local changes first, then retry.
      Fix any other blockers reported.

7. **Quality check**

   Spawn quality engineer with worktree:false (read-only, no file edits):
   \`\`\`
   team_spawn name:"quality" agent:"quality-engineer" worktree:false prompt:"<task list, context files, run tests + build + lint + verify acceptance criteria, send results to lead when done>"
   \`\`\`
   Wait for message → team_results → fix blockers → team_shutdown (no team_merge needed, worktree:false)

8. **Mark tasks complete in openspec**

   Update tasks.md: \`- [ ]\` → \`- [x]\` for each completed task.
   Run \`rtk openspec status --change "<name>" --json\` to confirm.

9. **Show status, then cleanup**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive with \`/opsx-archive\`
   - If paused: explain why and wait for guidance

   Then run \`team_cleanup\`.

**Guardrails**
- NEVER skip or reorder steps 6a-6f
- NEVER implement tasks directly. Always use team_create + team_spawn, no exceptions
- NEVER touch source files before team_create is called, not even one edit
- NEVER call team_spawn without the agent field — it is required and will fail without it
- NEVER call team_spawn before team_tasks_add — tasks must exist before agents are spawned
- NEVER poll team_results or team_status in a loop — wait for teammates to message you
- NEVER call team_claim or team_tasks_complete as lead — only agents call these tools
- ALWAYS pass the task IDs returned by team_tasks_add to each agent's spawn prompt
- NEVER edit files between team_spawn and team_merge — team_merge blocks on overlapping local changes
- ALWAYS run team_cleanup force:true before team_create to clear stale state
- ALWAYS add every task from tasks.md to the board with team_tasks_add before spawning
- ALWAYS spawn one at a time, waiting for each result before the next (avoids worktree contention)
- ALWAYS instruct agents to call team_claim before each task and team_tasks_complete after — this is the ensemble-intended flow
- If teammates are stuck, use team_message to resend tasks, then wait — never implement directly
- Mark tasks complete in openspec AFTER specialists finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
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


import fse from 'fs-extra'
import path from 'node:path'

export const APPLY_TARGETS = [
  path.join('.opencode', 'commands', 'opsx-apply.md'),
  path.join('.opencode', 'skills', 'openspec-apply-change', 'SKILL.md'),
]

export const ENSEMBLE_SECTION = `6. **Implement via ensemble team**

   NEVER implement tasks directly. Always delegate to specialists via ensemble.
   Do NOT touch any source files before the team is running, not even a single edit.

   Steps MUST be followed in order. Do not skip any step.

   **Step 6a.** Create feature branch if not already on one: \`feature/{id}-{slug}\`

   **Step 6b.** Create the team:
      \`\`\`
      team_create "<change-name>-<random 4 digit number>"
      \`\`\`
      Announce: "Team running. Monitor at http://localhost:4747/"

   **Step 6c.** Add ALL tasks to the shared board BEFORE spawning anyone.
      Schema: { content: string, priority: "high"|"medium"|"low", depends_on?: string[] }
      Use depends_on to block tasks that require other tasks first, pass the IDs returned by team_tasks_add.
      \`\`\`
      team_tasks_add tasks:[
        { content: "1.1 <exact task text from tasks.md>", priority: "high" },
        { content: "1.2 <exact task text>", priority: "high" },
        { content: "3.1 <task that needs 1.x done first>", priority: "medium", depends_on: ["<id-of-1.1>"] },
        ...every task, one entry each...
      ]
      \`\`\`
      Save the task IDs returned. Pass them to agents in step 6d.
      DO NOT call team_claim yourself, only agents claim tasks.
      DO NOT proceed to 6d until team_tasks_add succeeds.

   **Step 6d.** Discover relevant skills, then spawn specialists with an INITIAL BATCH of tasks.

      **ROLLING BATCH MODEL:**
      Agents do NOT receive all their tasks upfront. Instead:
      - Assign each agent an initial batch of up to 3 unblocked tasks.
      - When an agent completes its batch and messages back, the lead assigns the next batch of up to 3 unassigned tasks from the board that match the agent's domain.
      - Repeat until no pending tasks remain on the board.
      - Only shut down an agent when the board has no more tasks for its domain.

      Before spawning, scan \`.agents/skills/\` and read each \`SKILL.md\` description line.
      Match skills to agents by domain:
      - front-engineer: UI, components, framework skills (e.g. next-best-practices, browser-automation)
      - back-engineer: API, data, service skills
      - infra-engineer: cloud, pipeline, deployment skills
      - quality-engineer: testing, coverage skills

      Each team_spawn MUST include the agent field (required, causes NOT NULL error if omitted).

      The spawn prompt must contain exactly:
      1. Their name and role on this team
      2. Their initial batch of tasks (up to 3): include the LITERAL task IDs (e.g. "task-abc123") AND the task content. Copy them verbatim from the IDs returned by team_tasks_add. Do NOT paraphrase or omit IDs.
      3. Key context they need (summarized from context files, do NOT tell them to read files themselves)
      4. The 6 OpenCode tools they have available (these are OpenCode tools, NOT shell commands, call them directly as tools, never via bash):
         team_claim, team_tasks_complete, team_tasks_list, team_tasks_add, team_message, team_broadcast
      5. How to proceed: for EACH task ID listed, call team_claim tool with that exact task_id before starting it, call team_tasks_complete tool with that task_id after finishing it, then move to the next task. When all listed tasks are done, message lead with results. Lead may assign more tasks, do NOT shut down until lead confirms no more tasks.
      6. Which skills to load: list the skill names and paths they MUST read before implementing. Example: "Before starting, read \`.agents/skills/next-best-practices/SKILL.md\` and follow its rules for all Next.js code."

      Keep spawn prompts under 600 tokens. Do not describe team internals or how ensemble works.
      Only spawn agents whose tasks are actually needed by this change. Skip agents with no tasks.

      First spawn all agents (wait for each team_spawn to confirm before the next):
      \`\`\`
      team_spawn name:"back" agent:"back-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"front" agent:"front-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"infra" agent:"infra-engineer" prompt:"..."
      (wait for result)
      \`\`\`

      Then immediately send each spawned agent a start message that repeats their task IDs:
      \`\`\`
      team_message to:"back" text:"Start now. Load skills first. Your tasks: [task-<id1>] <task1 text>, [task-<id2>] <task2 text>. Call team_claim task_id:<id> for each before starting it."
      team_message to:"front" text:"Start now. Load skills first. Your tasks: [task-<id3>] <task3 text>. Call team_claim task_id:<id> before starting it."
      team_message to:"infra" text:"Start now. Load skills first. Your tasks: [task-<id4>] <task4 text>. Call team_claim task_id:<id> before starting it."
      \`\`\`
      Replace placeholders with REAL task IDs and content. Never send a generic "claim your first task" message without the actual IDs.

   **Step 6e.** After sending start messages, tell the user what is running, then STOP and wait.
      Do NOT call team_results, team_status, or team_broadcast in a loop.
      Teammates will message you when done or blocked. Wait for those messages.
      Tell the user exactly how to inspect progress:
      - \`team_status\` for team snapshot
      - \`team_tasks_list\` for board state
      - \`team_view member:"<name>"\` for a teammate live session
      - \`team_results from:"<name>"\` for full teammate report text

   **Step 6f.** When a teammate messages back (rolling re-assignment loop):
      1. Call \`team_results from:"<name>"\` to read full message.
      2. Call \`team_tasks_list\` to check remaining pending/unassigned tasks on the board.
      3. **If there are more unassigned tasks matching this agent's domain:**
         - Pick up to 3 unassigned, unblocked tasks for this agent's domain.
         - Send them via \`team_message to:"<name>" text:"Next tasks: [task-<id1>] <desc>, [task-<id2>] <desc>. Claim each with team_claim before starting."\`
         - Do NOT shut down the agent. Go back to waiting (step 6e).
      4. **If no more tasks for this agent:**
         - \`team_shutdown member:"<name>"\`
         - \`team_merge member:"<name>"\`
         - If team_merge blocks on local changes: \`git stash\`, retry merge, \`git stash pop\`.
      5. **If ALL agents are shut down and tasks remain unassigned** (new domain, dependencies unblocked):
         - Spawn new agents for the remaining tasks (back to step 6d).
      6. **If ALL tasks are done:** proceed to step 7.
      If a teammate reports rate-limit/quota/token exhaustion, immediately shutdown that teammate and respawn with an available model.

      **ZERO PENDING TASKS GUARANTEE:** Before proceeding to step 7, call \`team_tasks_list\` and verify EVERY task is either \`done\` or \`blocked\`. If any task is \`pending\` and unassigned, assign it to an agent or spawn a new one. Never leave pending tasks orphaned.

7. **Quality check**

   Spawn quality engineer with worktree:false (read-only, no file edits):
   \`\`\`
   team_spawn name:"quality" agent:"quality-engineer" worktree:false prompt:"<verification scope, context summary, run tests + build + lint + verify acceptance criteria, no task claiming required in this phase, send results to lead when done>"
   \`\`\`
   Wait for message -> team_results -> fix blockers -> team_shutdown (no team_merge needed, worktree:false)

8. **Mark tasks complete in openspec**

   Update tasks.md: \`- [ ]\` -> \`- [x]\` for each completed task.
   Run \`openspec status --change "<name>" --json\` to confirm.

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
- NEVER call team_spawn without the agent field, it is required and will fail without it
- NEVER call team_spawn before team_tasks_add, tasks must exist before agents are spawned
- NEVER poll team_results or team_status in a loop, wait for teammates to message you
- NEVER call team_claim or team_tasks_complete as lead, only agents call these tools
- NEVER leave pending tasks orphaned, always verify board is empty before proceeding to step 7
- ALWAYS pass the LITERAL task IDs returned by team_tasks_add into each agent's spawn prompt, copy the exact IDs, never paraphrase
- ALWAYS assign initial batch of up to 3 tasks per agent; re-assign next batch (up to 3) via team_message when agent reports done
- ALWAYS call team_tasks_list after each agent reports done to check for remaining unassigned tasks
- ALWAYS repeat the same literal task IDs in the team_message start trigger, never send a generic "claim your first task" without the actual IDs
- NEVER send a start message that omits task IDs; if a task ID is missing from the start message, the agent cannot claim
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- ALWAYS add every task to the board with team_tasks_add before spawning
- ALWAYS spawn agents sequentially (wait for each team_spawn result before the next), then send start messages to all of them together
- ALWAYS instruct agents to call team_claim before each task and team_tasks_complete after
- ALWAYS shut down + merge agents only when no more tasks remain for their domain
- If teammates are stuck, use team_message to resend tasks, then wait, never implement directly
- Mark tasks complete in openspec AFTER specialists finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
- Follow CLI rules from \`@ob-global\` when present
- If model quota/rate-limit is exhausted, tell lead immediately via team_message and stop claiming new tasks until respawned
`

const STEP_6_START = /^6\.\s+\*\*Implement\b/im
const FLUID_SECTION = /^\*\*Fluid Workflow Integration\*\*/im

export async function patchApplyFile(filePath) {
  if (!await fse.pathExists(filePath)) return { ok: false, reason: 'missing-file' };

  const original = await fse.readFile(filePath, 'utf-8');
  const startMatch = original.match(STEP_6_START);
  if (!startMatch || startMatch.index === undefined) return { ok: false, reason: 'missing-step-6' };

  const before = original.slice(0, startMatch.index).replace(/\s*$/, '');
  const fromStep6 = original.slice(startMatch.index);
  const fluidMatch = fromStep6.match(FLUID_SECTION);

  const after = fluidMatch && fluidMatch.index !== undefined
    ? `\n\n${fromStep6.slice(fluidMatch.index).replace(/^\s*/, '')}`
    : '';

  const patched = `${before}\n\n${ENSEMBLE_SECTION}${after}`;
  await fse.writeFile(filePath, patched, 'utf-8');
  return { ok: true };
}

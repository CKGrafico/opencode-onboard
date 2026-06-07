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

   **Step 6c.** Add ALL tasks to the shared board BEFORE spawning anyone, using as many \`team_tasks_add\` calls as needed to wire dependencies correctly.
      Schema: { content: string, priority: "high"|"medium"|"low", depends_on?: string[] }
      You cannot reference returned task IDs until an earlier \`team_tasks_add\` call finishes, so add tasks in dependency order.
      \`\`\`
      team_tasks_add tasks:[
        { content: "1.1 <exact task text from tasks.md>", priority: "high" },
        { content: "1.2 <exact task text>", priority: "high" }
      ]
      \`\`\`
      Save the returned IDs for root tasks.
      \`\`\`
      team_tasks_add tasks:[
        { content: "2.1 <task that depends on 1.1>", priority: "high", depends_on: ["<real-id-of-1.1>"] },
        { content: "3.1 <task that depends on 1.2>", priority: "medium", depends_on: ["<real-id-of-1.2>"] }
      ]
      \`\`\`
      Repeat until every OpenSpec task is on the board, then pass the literal IDs returned by those calls to agents in step 6d.
      DO NOT call team_claim yourself, only agents claim tasks.
      DO NOT proceed to 6d until team_tasks_add succeeds.

   **Step 6d.** Discover available engineers, then spawn specialists with an INITIAL BATCH of tasks.

      **ROLLING BATCH MODEL:**
      Agents do NOT receive all their tasks upfront. Instead:
      - Assign each agent an initial batch of up to 3 unblocked tasks.
      - When an agent completes its batch and messages back, the lead assigns the next batch of up to 3 unassigned tasks from the board that match the agent's domain.
      - Repeat until no pending tasks remain on the board.
      - Only shut down an agent when the board has no more tasks for its domain.

      Before spawning:
      - scan \`.agents/agents/\` and list the engineers that actually exist in this project
      - exclude \`devops-manager\` from implementation selection
      - read each engineer's description and abilities
      - prefer the most specialized custom engineer whose description and abilities match the task
      - use \`basic-engineer\` only when no custom engineer is a clear fit or as a recovery fallback
      - never spawn an engineer name that is not present in \`.agents/agents/\`

      Each \`team_spawn\` MUST include the agent field (required, causes NOT NULL error if omitted).

      The spawn prompt must be short and operational. It must contain:
      1. Their name and engineer file on this team
      2. Their initial batch of tasks (up to 3): include the LITERAL task IDs AND the task content. Copy them verbatim from the IDs returned by \`team_tasks_add\`. Do NOT paraphrase or omit IDs.
      3. Key context they need, summarized from context files
      4. Exact verification commands or acceptance checks
      5. Only the mandatory skill names or repo-specific rules they still need after claim

      Keep spawn prompts short and concrete. Prefer 120-220 tokens. Do NOT paste a generic tool list or long workflow boilerplate the plugin and agent file already provide.
      ALWAYS set \`claim_task\` to the first unblocked task in that agent's initial batch.
      Only spawn agents whose tasks are actually needed by this change. Skip agents with no tasks.

      Prompt shape:
      \`\`\`
      You are <worker-name>, <engineer-file>.
      Claim this task immediately as your first action:
      - [task-<id1>] <task text>
      <optional more tasks in the batch>

      Key context:
      - <short bullets>

      After claiming:
      1. Load @ob-global
      2. Load only the relevant abilities/skills for this task
      3. Implement the task
      4. Call team_tasks_complete for the same task ID
      5. Send a short team_message with files changed and checks run
      \`\`\`

      Spawn sequentially, waiting for each result:
      \`\`\`
      team_spawn name:"ui1" agent:"frontend-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"api1" agent:"backend-engineer" prompt:"..."
      (wait for result)
      \`\`\`
      Replace example agent names with REAL engineers that exist in this project.

      Then send each spawned agent a short start message that repeats their exact task IDs if needed:
      \`\`\`
      team_message to:"ui1" text:"Claim now: [task-<id1>] <task text>."
      \`\`\`
      Never send a generic "claim your first task" message without the actual IDs.
      If \`claim_task\` already covers the first task, keep the start message minimal. Use follow-up messages mainly for additional tasks in the batch or recovery.

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
      3. If the teammate is idle and has not claimed any assigned task:
         - resend one short claim-only message with the same literal task IDs
         - if they still do not claim, \`team_shutdown member:"<name>" force:true\`
         - respawn once with a shorter prompt and the same first \`claim_task\`
         - if the second spawn also stays idle, stop forcing ensemble for this change and continue in the main session or ask the user whether to retry later
      4. **If there are more unassigned tasks matching this agent's domain:**
          - Pick up to 3 unassigned, unblocked tasks for this agent's domain.
          - Send them via \`team_message to:"<name>" text:"Claim next: [task-<id1>] <desc>, [task-<id2>] <desc>."\`
          - Do NOT shut down the agent. Go back to waiting (step 6e).
      5. **If no more tasks for this agent:**
          - \`team_shutdown member:"<name>"\`
          - \`team_merge member:"<name>"\`
          - If team_merge blocks on local changes: \`git stash\`, retry merge, \`git stash pop\`.
      6. **If ALL agents are shut down and tasks remain unassigned** (new domain, dependencies unblocked):
          - Discover the remaining matching engineers from \`.agents/agents/\` and spawn a new wave (back to step 6d).
      7. **If ALL tasks are done:** proceed to step 7.
      If a teammate reports rate-limit/quota/token exhaustion, immediately shutdown that teammate and respawn with an available model.

      **ZERO PENDING TASKS GUARANTEE:** Before proceeding to step 7, call \`team_tasks_list\` and verify EVERY task is either \`done\` or \`blocked\`. If any task is \`pending\` and unassigned, assign it to an agent or spawn a new one. Never leave pending tasks orphaned.

7. **Quality check**

   Spawn the best available verification-capable engineer with \`worktree:false\` (for example, a testing-focused custom engineer or \`basic-engineer\` if no better verifier exists):
   \`\`\`
   team_spawn name:"verify" agent:"<real-verifier-engineer>" worktree:false prompt:"<verification scope, context summary, run tests + build + lint + verify acceptance criteria, no task claiming required in this phase, send results to lead when done>"
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
- NEVER call team_spawn before all tasks are on the board; use multiple \`team_tasks_add\` calls when dependencies require real IDs from earlier calls
- NEVER poll team_results or team_status in a loop, wait for teammates to message you
- NEVER call team_claim or team_tasks_complete as lead, only agents call these tools
- NEVER leave pending tasks orphaned, always verify board is empty before proceeding to step 7
- ALWAYS pass the LITERAL task IDs returned by team_tasks_add into each agent's spawn prompt, copy the exact IDs, never paraphrase
- ALWAYS assign initial batch of up to 3 tasks per agent; re-assign next batch (up to 3) via team_message when agent reports done
- ALWAYS call team_tasks_list after each agent reports done to check for remaining unassigned tasks
- ALWAYS repeat the same literal task IDs in any task assignment message, never send a generic "claim your first task" without the actual IDs
- NEVER send a start message that omits task IDs; if a task ID is missing from the start message, the agent cannot claim
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- ALWAYS add every task to the board before spawning, using multiple \`team_tasks_add\` calls when dependency wiring requires it
- ALWAYS discover engineers from \`.agents/agents/\` and prefer matching custom engineers over \`basic-engineer\`
- ALWAYS spawn agents sequentially (wait for each team_spawn result before the next), then send start messages to all of them together
- ALWAYS set \`claim_task\` for the first unblocked task in each initial batch and instruct agents to claim before any other work
- ALWAYS shut down + merge agents only when no more tasks remain for their domain
- If teammates are stuck, use one short claim-only message, then one respawn with a shorter prompt. If repeated idle/stall continues, stop forcing ensemble and continue outside it.
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

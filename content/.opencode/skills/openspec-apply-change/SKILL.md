---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change via ensemble agent team. Use when the user wants to start implementing, continue implementation, or work through tasks.
license: MIT
compatibility: Requires openspec CLI and opencode-ensemble plugin.
metadata:
  author: openspec-onboard
  version: "2.0"
---

Implement tasks from an OpenSpec change using the ensemble agent team.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Check status to understand the schema**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
   - If `state: "all_done"`: congratulate, suggest archive with `/opsx-archive`
   - Otherwise: proceed to implementation

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   Do NOT tell agents to read files themselves, summarize the content here and pass it in spawn prompts.

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview

6. **Implement via ensemble team**

   NEVER implement tasks directly. Always delegate to engineer workers via ensemble.
   Do NOT touch any source files before the team is running, not even a single edit.

   Steps MUST be followed in order. Do not skip any step.

   **Step 6a.** Create feature branch if not already on one: `feature/{id}-{slug}`

   **Step 6b.** Create the team:
      ```
      team_create "<change-name>-<random 4 digit number>"
      ```
      Announce: "Team running. Monitor at http://localhost:4747/"

   **Step 6c.** Add ALL tasks to the shared board BEFORE spawning anyone.
      Schema: { content: string, priority: "high"|"medium"|"low", depends_on?: string[] }
      Use depends_on to block tasks that require other tasks first, pass the IDs returned by team_tasks_add.
      ```
      team_tasks_add tasks:[
        { content: "1.1 <exact task text from tasks.md>", priority: "high" },
        { content: "1.2 <exact task text>", priority: "high" },
        { content: "3.1 <task that needs 1.x done first>", priority: "medium", depends_on: ["<id-of-1.1>"] },
        ...every task, one entry each...
      ]
      ```
      Save the task IDs returned. Pass them to agents in step 6d.
      DO NOT call team_claim yourself, only agents claim tasks.
      DO NOT proceed to 6d until team_tasks_add succeeds.

   **Step 6d.** Discover available agents, assign an INITIAL BATCH of tasks, then spawn workers.

       **ROLLING BATCH MODEL:**
       Agents do NOT receive all their tasks upfront. Instead:
       - Assign each agent an initial batch of up to 3 unblocked tasks.
       - When an agent completes its batch and messages back, the lead assigns the next batch of up to 3 unassigned tasks from the board that match the agent's domain.
       - Repeat until no pending tasks remain on the board.
       - Only shut down an agent when the board has no more tasks for its domain.

       Agent discovery and assignment rule:
       - Read `.agents/agents/*.md` and use each agent's `description` and `## Abilities` to understand specialization.
       - For each task ID, choose the best-fit agent based on task domain (backend, frontend, infra, testing, etc.).
       - Prefer specialized agents when available; use `basic-engineer` as fallback only.
       - Only spawn agents that have assigned task IDs.

       REQUIRED assignment algorithm (do not skip):
       1. Build candidate list from `.agents/agents/*.md` excluding `devops-manager`.
       2. Classify each task by domain using task text (api/backend, ui/frontend, infra/devops, testing/qa).
       3. For each task, score every candidate agent:
          - +3 if agent description explicitly matches domain
          - +2 if agent `## Abilities` include domain-relevant skills
          - +1 if prior tasks of same domain already assigned to that agent (cohesion)
       4. Assign task to highest-score agent.
       5. Use `basic-engineer` ONLY when no specialized agent has positive score.
       6. If all tasks go to `basic-engineer`, you MUST explain why no specialist matched.

       HARD RULES:
       - NEVER assign a task to `basic-engineer` if a specialized agent has higher score.
       - NEVER skip agent discovery from `.agents/agents/*.md`.
       - ALWAYS include assignment rationale in spawn prompt: "Selected because <domain match>".

       Skill loading is worker-driven:
       - The spawned agent MUST load `@ob-global` first.
       - Then it MUST load skills from its own `## Abilities` for the claimed task domain.

       Each team_spawn MUST include the agent field (required, causes NOT NULL error if omitted).

       The spawn prompt must contain exactly:
       1. Their name and role on this team
       1.1 Why they were selected for those tasks (domain/abilities match)
       2. Their initial batch of tasks (up to 3): list the LITERAL task IDs and content from the board.
       3. Key context they need (summarized from context files, do NOT tell them to read files themselves)
       4. The 6 OpenCode tools they have available (these are OpenCode tools, NOT shell commands, call them directly as tools, never via bash):
          team_claim, team_tasks_complete, team_tasks_list, team_tasks_add, team_message, team_broadcast
       5. How to proceed: call team_claim tool with the task_id to claim a task before starting it, call team_tasks_complete tool after finishing it, repeat until all listed tasks are done, then call team_message tool to notify lead with results. Lead may assign more tasks, do NOT shut down until lead confirms no more tasks.
       6. Which skills to load: list the skill names and paths they MUST read before implementing. Example: "Before starting, read `.agents/skills/next-best-practices/SKILL.md` and follow its rules for all Next.js code."

       Keep spawn prompts under 600 tokens. Do not describe team internals or how ensemble works.
       Only spawn agents whose tasks are actually needed by this change. Skip agents with no tasks.

       Spawn one or more best-fit workers (parallel when dependencies allow):
       ```
       team_spawn name:"eng-1" agent:"backend-engineer" prompt:"..."
       team_spawn name:"eng-2" agent:"frontend-engineer" prompt:"..."
       team_spawn name:"eng-3" agent:"basic-engineer" prompt:"..."
       ```

       Then immediately send each spawned worker a start message with exact task IDs:
       ```
       team_message to:"eng-1" text:"Start now. Load @ob-global first, then use your agent `## Abilities` for these tasks: [task-<id1>] ... Claim each task ID before starting."
       team_message to:"eng-2" text:"Start now. Load @ob-global first, then use your agent `## Abilities` for these tasks: [task-<id2>] ... Claim each task ID before starting."
       team_message to:"eng-3" text:"Start now. Load @ob-global first, then use your agent `## Abilities` for these tasks: [task-<id3>] ... Claim each task ID before starting."
       ```

   **Step 6e.** After sending start messages, tell the user what is running, then STOP and wait.
       Do NOT call team_results, team_status, or team_broadcast in a loop.
       Teammates will message you when done or blocked. Wait for those messages.

   **Step 6f.** When a teammate messages back (rolling re-assignment loop):
       1. Call `team_results from:"<name>"` to read full message.
       2. Call `team_tasks_list` to check remaining pending/unassigned tasks on the board.
       3. **If there are more unassigned tasks matching this agent's domain:**
          - Pick up to 3 unassigned, unblocked tasks for this agent's domain.
          - Send them via `team_message to:"<name>" text:"Next tasks: [task-<id1>] <desc>, [task-<id2>] <desc>. Claim each with team_claim before starting."`
          - Do NOT shut down the agent. Go back to waiting (step 6e).
       4. **If no more tasks for this agent:**
          - `team_shutdown member:"<name>"`
          - `team_merge member:"<name>"`
          - If team_merge blocks on local changes: `git stash`, retry merge, `git stash pop`.
       5. **If ALL agents are shut down and tasks remain unassigned:**
          - Spawn new agents for the remaining tasks (back to step 6d).
       6. **If ALL tasks are done:** proceed to step 7.

       **ZERO PENDING TASKS GUARANTEE:** Before proceeding to step 7, call `team_tasks_list` and verify EVERY task is either `done` or `blocked`. If any task is `pending` and unassigned, assign it to an agent or spawn a new one. Never leave pending tasks orphaned.

7. **Verification check**

   Run verification tasks (tests/build/lint) using a worker suited for verification scope:
   - either same engineer workers
   - or a dedicated verifier worker if your project defines one

   Wait for results → fix blockers.

8. **Mark tasks complete in openspec**

   Update tasks.md: `- [ ]` → `- [x]` for each completed task.
   Run `openspec status --change "<name>" --json` to confirm.

9. **Show status, then cleanup**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive with `/opsx-archive`
   - If paused: explain why and wait for guidance

   Then run `team_cleanup`.

**Guardrails**
- NEVER skip or reorder steps 6a-6f
- NEVER implement tasks directly. Always use team_create + team_spawn, no exceptions
- NEVER touch source files before team_create is called, not even one edit
- NEVER call team_spawn without the agent field, it is required and will fail without it
- NEVER call team_spawn before team_tasks_add, tasks must exist before agents are spawned
- NEVER poll team_results or team_status in a loop, wait for teammates to message you
- NEVER call team_claim or team_tasks_complete as lead, only agents call these tools
- NEVER leave pending tasks orphaned, always verify board is empty before proceeding to step 7
- ALWAYS assign initial batch of up to 3 tasks per agent; re-assign next batch (up to 3) via team_message when agent reports done
- ALWAYS call team_tasks_list after each agent reports done to check for remaining unassigned tasks
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- ALWAYS add every task to the board with team_tasks_add before spawning
- ALWAYS spawn workers based on dependencies: parallel when safe, sequential when required
- ALWAYS instruct agents to call team_claim before each task and team_tasks_complete after
- ALWAYS shut down + merge agents only when no more tasks remain for their domain
- If teammates are stuck, use team_message to resend tasks, then wait, never implement directly
- Mark tasks complete in openspec AFTER worker implementation and verification finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
- Follow CLI rules from `@ob-global` when present

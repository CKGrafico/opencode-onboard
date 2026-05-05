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
   - If ambiguous, run `rtk openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Check status to understand the schema**

   ```bash
   rtk openspec status --change "<name>" --json
   ```

   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   rtk openspec instructions apply --change "<name>" --json
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

   NEVER implement tasks directly. Always delegate to specialists via ensemble.
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

   **Step 6d.** Spawn all needed specialists, then kick them off in parallel.

      Each team_spawn MUST include the agent field (required, causes NOT NULL error if omitted).

      The spawn prompt must contain exactly:
      1. Their name and role on this team
      2. Which tasks are theirs, list the task IDs and content from the board
      3. Key context they need (summarized from context files, do NOT tell them to read files themselves)
      4. The 6 OpenCode tools they have available (these are OpenCode tools, NOT shell commands, call them directly as tools, never via bash):
         team_claim, team_tasks_complete, team_tasks_list, team_tasks_add, team_message, team_broadcast
      5. How to proceed: call team_claim tool with the task_id to claim a task before starting it, call team_tasks_complete tool after finishing it, repeat until all their tasks are done, then call team_message tool to notify lead with results or blockers

      Keep spawn prompts under 500 tokens. Do not describe team internals or how ensemble works.
      Only spawn agents whose tasks are actually needed by this change. Skip agents with no tasks.

      First spawn all agents (wait for each team_spawn to confirm before the next):
      ```
      team_spawn name:"back" agent:"back-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"front" agent:"front-engineer" prompt:"..."
      (wait for result)
      team_spawn name:"infra" agent:"infra-engineer" prompt:"..."
      (wait for result)
      ```

      Then immediately send each spawned agent a start message to kick them off:
      ```
      team_message to:"back" text:"Start now. Claim your first task with team_claim and begin implementing."
      team_message to:"front" text:"Start now. Claim your first task with team_claim and begin implementing."
      team_message to:"infra" text:"Start now. Claim your first task with team_claim and begin implementing."
      ```

   **Step 6e.** After sending start messages, tell the user what is running, then STOP and wait.
      Do NOT call team_results, team_status, or team_broadcast in a loop.
      Teammates will message you when done or blocked. Wait for those messages.

   **Step 6f.** When a teammate messages back, you receive a ping only, the full content is NOT in the notification.
      Call team_results to read the full message and mark it read. Then for each teammate: team_shutdown → team_merge.
      If team_merge blocks ("overlapping local changes"), commit or stash your local changes first, then retry.
      Fix any other blockers reported.

7. **Quality check**

   Spawn quality engineer with worktree:false (read-only, no file edits):
   ```
   team_spawn name:"quality" agent:"quality-engineer" worktree:false prompt:"<verification scope, context summary, run tests + build + lint + verify acceptance criteria, no task claiming required in this phase, send results to lead when done>"
   ```
   Wait for message → team_results → fix blockers → team_shutdown (no team_merge needed, worktree:false)

8. **Mark tasks complete in openspec**

   Update tasks.md: `- [ ]` → `- [x]` for each completed task.
   Run `rtk openspec status --change "<name>" --json` to confirm.

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
- ALWAYS pass the task IDs returned by team_tasks_add to each agent's spawn prompt
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- ALWAYS add every task to the board with team_tasks_add before spawning
- ALWAYS spawn agents sequentially (wait for each team_spawn result before the next), then send start messages to all of them together
- ALWAYS instruct agents to call team_claim before each task and team_tasks_complete after
- If teammates are stuck, use team_message to resend tasks, then wait, never implement directly
- Mark tasks complete in openspec AFTER specialists finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
- Use `rtk` wrapper for ALL CLI commands. Never run openspec, git, gh, or az directly

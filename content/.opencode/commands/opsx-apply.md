---
description: Implement tasks from an OpenSpec change via ensemble agent team
---

Implement tasks from an OpenSpec change using the ensemble agent team.

**Input**: Optionally specify a change name (e.g., `/opsx-apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

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
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx-continue`
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

   **Step 6d.** Discover available agents, assign tasks by best fit, then spawn workers.

      **CONCURRENCY LIMIT: Maximum 3 agents at a time.**
      If more than 3 agents are needed, spawn in waves: first 3, wait for them to finish, merge, then spawn next batch.
      This prevents file contention, context exhaustion, and stalled agents.

      **FILE DOMAIN SEPARATION (mandatory):**
      Each agent MUST own a non-overlapping set of files/directories. Examples:
      - Agent A owns `src/backend/Application/Commands/` — Agent B owns `src/backend/Application/Queries/`
      - Agent A owns `src/frontend/app/(auth)/events/` — Agent B owns `src/frontend/app/(auth)/admin/`
      Never assign two agents tasks that touch the same file or controller.

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

      **Spawn prompt format (strict, max 400 tokens):**

      ```
      You are {name}, {role}. Your file domain: {list of directories you own exclusively}.

      Tasks (claim each with team_claim before starting, team_tasks_complete after commit):
      - {task_id_1}: {one-line description}
      - {task_id_2}: {one-line description}

      Context: {2-3 sentences of essential context from the specs, NOT full file contents}

      Build command: {e.g., "dotnet build TechEvents.slnx" or "pnpm build"}
      After each task: git add -A && git commit -m "feat: <description>"

      Start with team_claim on your first task NOW. Do not read files or plan first.
      ```

      DO NOT include:
      - Full file contents or code snippets in the prompt
      - Descriptions of how ensemble works
      - Lists of available tools (the agent already knows from its agent.md)
      - Instructions to "message lead when planning" — agents should only message when DONE or BLOCKED

      Spawn workers:
      ```
      team_spawn name:"eng-1" agent:"backend-engineer" prompt:"..."
      team_spawn name:"eng-2" agent:"frontend-engineer" prompt:"..."
      ```

      Then immediately send each spawned worker a start message:
      ```
      team_message to:"eng-1" text:"Start now. First action: team_claim {first_task_id}. Go."
      team_message to:"eng-2" text:"Start now. First action: team_claim {first_task_id}. Go."
      ```

   **Step 6e.** After sending start messages, tell the user what is running, then STOP and wait.
      Do NOT call team_results, team_status, or team_broadcast in a loop.
      Teammates will message you when done or blocked. Wait for those messages.

      Tell the user: "Agents spawned. Check dashboard at http://localhost:4747/. I'll report when they finish."

   **Step 6f.** When a teammate messages back:
      1. Call `team_results from:"<name>"` to read full message
      2. Call `team_shutdown member:"<name>"` immediately
      3. Call `team_merge member:"<name>"` immediately
      4. If team_merge blocks on local changes: `git stash`, retry merge, `git stash pop`
      5. Mark their tasks complete in the board if they didn't already
      6. If more waves are needed, spawn next batch (back to step 6d)

      **IMMEDIATE SHUTDOWN RULE:** Never leave a finished agent running. The moment they report done, shut them down and merge. Idle agents waste slots and cause naming collisions on respawn.

   **Step 6g. Stall detection (if agent has no commits after 5 minutes):**
      1. `team_message to:"<name>" text:"Status? If stuck, report blocker. If not started, run team_claim {task_id} now."`
      2. Wait 2 more minutes
      3. If still no response: `team_shutdown member:"<name>" force:true`
      4. Respawn with same tasks, fresh prompt
      5. Log stall in session-log for post-mortem

7. **Verification check**

   After ALL agents are merged, run verification on the lead branch directly:
   ```bash
   # Backend
   dotnet build <solution>
   # Frontend
   pnpm build
   ```
   Fix any errors yourself (small fixes only). If large fixes needed, spawn one more agent.

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
- ALWAYS pass the task IDs returned by team_tasks_add to each agent's spawn prompt
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- ALWAYS add every task to the board with team_tasks_add before spawning
- ALWAYS spawn workers based on dependencies: parallel when safe, sequential when required
- ALWAYS instruct agents to call team_claim before each task and team_tasks_complete after
- ALWAYS enforce max 3 concurrent agents
- ALWAYS enforce non-overlapping file domains per agent
- ALWAYS shut down + merge agents immediately when they report done
- If teammates are stuck, use team_message to nudge, then stall detection (step 6g)
- Mark tasks complete in openspec AFTER worker implementation and verification finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
- Follow CLI rules from `@ob-global` when present

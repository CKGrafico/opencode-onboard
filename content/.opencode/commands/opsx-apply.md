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

5b. **Scope & cost confirmation gate**

   Before spawning any agents, always run this check:

   1. Count remaining (incomplete) tasks from the apply instructions output.
   2. Classify cost tier:
      - **Low**: 1–3 tasks — short session, fast models likely sufficient
      - **Medium**: 4–7 tasks — meaningful cost, consider splitting across sessions
      - **High**: 8+ tasks — significant cost, strongly consider splitting the change
   3. Run `/quota` if the opencode-quota plugin is available to surface current budget state.
   4. **Always announce** before proceeding: cost tier, remaining task count, and current quota (if available).
   5. If cost tier is **Medium or High** (≥ 4 remaining tasks): use **AskUserQuestion tool** to ask the user: "About to spawn agents for N tasks (cost tier: MEDIUM/HIGH). Continue with implementation? (yes/no)"
      - If **no**: stop here. Suggest splitting the change into smaller pieces with `openspec` or reducing scope. Do not proceed to step 6.
      - If **yes**: proceed to step 6.
   6. If cost tier is **Low** (≤ 3 tasks): proceed automatically to step 6 (no confirmation needed).

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

   **Step 6c.** Add ALL tasks to the shared board BEFORE spawning anyone, using as many `team_tasks_add` calls as needed to wire dependencies correctly.
      Schema: { content: string, priority: "high"|"medium"|"low", depends_on?: string[] }
      You cannot reference returned task IDs until an earlier `team_tasks_add` call finishes, so add tasks in dependency order.
      ```
      team_tasks_add tasks:[
        { content: "1.1 <exact task text from tasks.md>", priority: "high" },
        { content: "1.2 <exact task text>", priority: "high" }
      ]
      ```
      Save the returned IDs for root tasks.
      ```
      team_tasks_add tasks:[
        { content: "2.1 <task that depends on 1.1>", priority: "high", depends_on: ["<real-id-of-1.1>"] },
        { content: "3.1 <task that depends on 1.2>", priority: "medium", depends_on: ["<real-id-of-1.2>"] }
      ]
      ```
      Repeat until every OpenSpec task is on the board, then pass the literal IDs returned by those calls to agents in step 6d.
      DO NOT call team_claim yourself, only agents claim tasks.
      DO NOT proceed to 6d until team_tasks_add succeeds.

   **Step 6d.** Discover available engineers, assign an INITIAL BATCH of tasks, then spawn workers.

       **ROLLING BATCH MODEL:**
       Agents do NOT receive all their tasks upfront. Instead:
       - Assign each agent an initial batch of up to 3 unblocked tasks.
       - When an agent completes its batch and messages back, the lead assigns the next batch of up to 3 unassigned tasks from the board that match the agent's domain.
       - Repeat until no pending tasks remain on the board.
       - Only shut down an agent when the board has no more tasks for its domain.

       Before spawning:
       - scan `.opencode/agents/` and list the engineers that actually exist in this project
       - exclude `devops-manager` from implementation selection
       - read each engineer's description and abilities
       - prefer the most specialized custom engineer whose description and abilities match the task
       - use `basic-engineer` only when no custom engineer is a clear fit or as a recovery fallback
        - never spawn an engineer name that is not present in `.opencode/agents/`

        **Model resolution for spawned agents (do not skip):**
        Before each `team_spawn`, resolve the model for that agent using this priority:
        1. **Agent file frontmatter** — Read `.opencode/agents/<engineer-file>` and check for a `model:` field in the YAML frontmatter. This is the user's explicit choice for this specific agent.
        2. **`ensemble.json` `modelsByAgent`** — Read `.opencode/ensemble.json`. If `modelsByAgent` contains a key matching this agent's role (build agents → `build`, devops-manager → `explore`), use that value.
        3. **Active chat model** — Fall back to the model currently running this conversation (your own model).
        Never hardcode a model ID. Never skip this resolution. Log the result: `[model: <id> ← <source: agent frontmatter / ensemble.json modelsByAgent / active chat>]`

        REQUIRED assignment algorithm (do not skip):
       1. Build candidate list from `.opencode/agents/*.md` excluding `devops-manager`.
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
       - NEVER skip agent discovery from `.opencode/agents/*.md`.
       - ALWAYS include assignment rationale only when it changes task routing or is needed to justify using `basic-engineer`.

       Skill loading is worker-driven:
       - The spawned agent MUST load `@ob-global` first.
       - Then it MUST load skills from its own `## Abilities` for the claimed task domain.

       Each team_spawn MUST include the agent field (required, causes NOT NULL error if omitted).

       The spawn prompt must be short and operational. It must contain:
       1. Their name and engineer file on this team
       2. Their initial batch of tasks (up to 3): include the LITERAL task IDs AND the task content. Copy them verbatim from the IDs returned by `team_tasks_add`. Do NOT paraphrase or omit IDs.
       3. Key context they need, summarized from context files
       4. Exact verification commands or acceptance checks
       5. Only the mandatory skill names or repo-specific rules they still need after claim

       ```
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
       ```

       Keep spawn prompts short and concrete. Prefer 120-220 tokens. Do NOT paste a generic tool list or long workflow boilerplate the plugin and agent file already provide.
       ALWAYS set `claim_task` to the first unblocked task in that agent's initial batch.
       Only spawn agents whose tasks are actually needed by this change. Skip agents with no tasks.

        Spawn sequentially, waiting for each result:
        ```
        team_spawn name:"ui1" agent:"frontend-engineer" model:"<resolved-model>" prompt:"..."
        (wait for result)
        team_spawn name:"api1" agent:"backend-engineer" model:"<resolved-model>" prompt:"..."
        (wait for result)
        ```
       Replace example agent names with REAL engineers that exist in this project.

       Then send each spawned worker a short start message that repeats their exact task IDs if needed:
       ```
       team_message to:"ui1" text:"Claim now: [task-<id1>] <task text>."
       ```
       Never send a generic "claim your first task" message without the actual IDs.
       If `claim_task` already covers the first task, keep the start message minimal. Use follow-up messages mainly for additional tasks in the batch or recovery.

   **Step 6e.** After sending start messages, tell the user what is running, then STOP and wait.
       Do NOT call team_results, team_status, or team_broadcast in a loop.
       Teammates will message you when done or blocked. Wait for those messages.

       Tell the user exactly how to inspect progress:
       - `team_status` for team snapshot
       - `team_tasks_list` for board state
       - `team_view member:"<name>"` for a teammate live session
       - `team_results from:"<name>"` for full teammate report text

   **Step 6f.** When a teammate messages back (rolling re-assignment loop):
       1. Call `team_results from:"<name>"` to read full message.
       2. Call `team_tasks_list` to check remaining pending/unassigned tasks on the board.
       3. If the teammate is idle and has not claimed any assigned task:
          - resend one short claim-only message with the same literal task IDs
          - if they still do not claim, `team_shutdown member:"<name>" force:true`
          - respawn once with a shorter prompt and the same first `claim_task`
          - if the second spawn also stays idle, stop forcing ensemble for this change and continue in the main session or ask the user whether to retry later
       4. **If there are more unassigned tasks matching this agent's domain:**
          - Pick up to 3 unassigned, unblocked tasks for this agent's domain.
          - Send them via `team_message to:"<name>" text:"Claim next: [task-<id1>] <desc>, [task-<id2>] <desc>."`
          - Do NOT shut down the agent. Go back to waiting (step 6e).
       5. **If no more tasks for this agent:**
          - `team_shutdown member:"<name>"`
          - `team_merge member:"<name>"`
          - If team_merge blocks on local changes: `git stash`, retry merge, `git stash pop`.
       6. **If ALL agents are shut down and tasks remain unassigned** (new domain, dependencies unblocked):
          - Discover the remaining matching engineers from `.opencode/agents/` and spawn a new wave (back to step 6d).
       7. **If ALL tasks are done:** proceed to step 7.

       **ZERO PENDING TASKS GUARANTEE:** Before proceeding to step 7, call `team_tasks_list` and verify EVERY task is either `done` or `blocked`. If any task is `pending` and unassigned, assign it to an agent or spawn a new one. Never leave pending tasks orphaned.

7. **Verification check**

   Spawn the best available verification-capable engineer with `worktree:false` (for example, a testing-focused custom engineer or `basic-engineer` if no better verifier exists):
   ```
   team_spawn name:"verify" agent:"<real-verifier-engineer>" worktree:false model:"<resolved-model>" prompt:"<verification scope, context summary, run tests + build + lint + verify acceptance criteria, no task claiming required in this phase, send results to lead when done>"
   ```
   Wait for message -> team_results -> fix blockers -> team_shutdown (no team_merge needed, worktree:false)

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
- NEVER skip step 5b scope & cost check before spawning
- NEVER spawn agents for Medium or High cost sessions (≥4 tasks) without explicit user confirmation from step 5b
- ALWAYS run `/quota` at session start (step 5b) when the opencode-quota plugin is available
- NEVER implement tasks directly. Always use team_create + team_spawn, no exceptions
- NEVER touch source files before team_create is called, not even one edit
- NEVER call team_spawn without the agent field, it is required and will fail without it
- NEVER call team_spawn without a resolved `model:` field; always pass the model resolved from the priority chain
- NEVER call team_spawn before all tasks are on the board; use multiple `team_tasks_add` calls when dependencies require real IDs from earlier calls
- NEVER poll team_results or team_status in a loop, wait for teammates to message you
- NEVER call team_claim or team_tasks_complete as lead, only agents call these tools
- NEVER edit files between team_spawn and team_merge, team_merge blocks on overlapping local changes
- NEVER leave pending tasks orphaned, always verify board is empty before proceeding to step 7
- ALWAYS pass the LITERAL task IDs returned by team_tasks_add into each agent's spawn prompt, copy the exact IDs, never paraphrase
- ALWAYS add every task to the board before spawning, using multiple `team_tasks_add` calls when dependency wiring requires it
- ALWAYS assign initial batch of up to 3 tasks per agent; re-assign next batch (up to 3) via team_message when agent reports done
- ALWAYS call team_tasks_list after each agent reports done to check for remaining unassigned tasks
- ALWAYS repeat the same literal task IDs in any task assignment message, never send a generic "claim your first task" without the actual IDs
- NEVER send a start message that omits task IDs; if a task ID is missing from the start message, the agent cannot claim
- ALWAYS discover engineers from `.opencode/agents/` and prefer matching custom engineers over `basic-engineer`
- ALWAYS spawn agents sequentially (wait for each team_spawn result before the next), then send start messages to all of them together
- ALWAYS set `claim_task` for the first unblocked task in each initial batch and instruct agents to claim before any other work
- ALWAYS shut down + merge agents only when no more tasks remain for their domain
- If teammates are stuck, use one short claim-only message, then one respawn with a shorter prompt. If repeated idle/stall continues, stop forcing ensemble and continue outside it.
- Mark tasks complete in openspec AFTER worker implementation and verification finish, not before
- Pause on errors, blockers, or unclear requirements. Do not guess
- Use contextFiles from CLI output, do not assume specific file paths
- Follow CLI rules from `@ob-global` when present

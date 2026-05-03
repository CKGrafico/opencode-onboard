import fs from "node:fs"
import path from "node:path"

const LOG_FILE = ".agents/session-log.json"

// Per-session state: editCount and loaded skills
const sessionState = new Map()

function ts() {
  return new Date().toISOString()
}

function appendEntry(directory, entry) {
  const logPath = path.join(directory, LOG_FILE)
  const dir = path.dirname(logPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  let entries = []
  if (fs.existsSync(logPath)) {
    try { entries = JSON.parse(fs.readFileSync(logPath, "utf8")) } catch (_) {}
  }
  entries.push(entry)
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), "utf8")
}

function resolveAgentName(session) {
  const agentPath = session?.agent
  if (agentPath) {
    const base = path.basename(agentPath, ".md")
    if (base) return base
  }
  return "lead"
}

function addSkillToState(state, skillName) {
  if (!skillName || !state) return false
  if (!state.skills) state.skills = new Set()
  if (state.skills.has(skillName)) return false
  state.skills.add(skillName)
  return true
}

function buildTeamSkillsSummary() {
  const byAgent = {}
  for (const state of sessionState.values()) {
    if (!state?.agentName) continue
    if (!byAgent[state.agentName]) byAgent[state.agentName] = new Set()
    for (const skill of state.skills ?? []) byAgent[state.agentName].add(skill)
  }

  const summary = {}
  for (const [agent, skills] of Object.entries(byAgent)) {
    summary[agent] = Array.from(skills).sort()
  }
  return summary
}

// Maps ensemble tool name → function that extracts the log entry fields from args
const ENSEMBLE_TOOL_HANDLERS = {
  team_create:         (args) => ({ action: "team-created",        team: args.name }),
  team_spawn:          (args) => ({ action: "teammate-spawned",    name: args.name, agentType: args.agent }),
  team_shutdown:       (args) => ({ action: "teammate-shutdown",   name: args.name }),
  team_merge:          (args) => ({ action: "teammate-merged",     name: args.name }),
  team_cleanup:        ()     => ({ action: "team-cleanup" }),
  team_status:         ()     => ({ action: "team-status-checked" }),
  team_results:        (args) => ({ action: "team-results-read",   from: args.from }),
  team_message:        (args) => ({ action: "team-message",        to: args.to ?? "lead", preview: String(args.text ?? "").slice(0, 120) }),
  team_broadcast:      (args) => ({ action: "team-broadcast",      preview: String(args.text ?? "").slice(0, 120) }),
  team_tasks_add:      (args) => ({ action: "tasks-added",         count: Array.isArray(args.tasks) ? args.tasks.length : "?" }),
  team_tasks_complete: (args) => ({ action: "task-completed",      taskId: args.task_id }),
  team_claim:          (args) => ({ action: "task-claimed",        taskId: args.task_id }),
}

export const SessionLogPlugin = async ({ client, directory }) => {
  return {
    event: async ({ event }) => {
      try {
        if (event?.type === "session.created") {
          const sessionId = event.properties?.id ?? event.properties?.sessionID
          if (!sessionId) return

          const res = await client.session.get({ path: { id: sessionId } })
          const session = res?.data
          const agentName = resolveAgentName(session)

          sessionState.set(sessionId, { agentName, editCount: 0, skills: new Set() })
          appendEntry(directory, { ts: ts(), agent: agentName, action: "started", sessionId })
        }

        if (event?.type === "file.edited") {
          const sessionId = event.properties?.sessionID ?? event.properties?.id
          if (!sessionId) return
          const state = sessionState.get(sessionId)
          if (state) state.editCount++
        }

        if (event?.type === "session.idle") {
          const sessionId = event.properties?.id ?? event.properties?.sessionID
          if (!sessionId) return
          const state = sessionState.get(sessionId)
          if (!state) return

          const { agentName, editCount } = state
          const skills = Array.from(state.skills ?? []).sort()
          appendEntry(directory, { ts: ts(), agent: agentName, action: "completed", filesEdited: editCount, skills })
          sessionState.delete(sessionId)
        }
      } catch (_) {}
    },

    "tool.execute.after": async (input, output) => {
      try {
        const sessionId = input?.sessionID ?? input?.session_id
        if (!sessionId) return

        const state = sessionState.get(sessionId)
        if (!state) return

        const tool = input?.tool

        // Track skill loads via skill tool (primary)
        if (tool === "skill") {
          const skillName = input?.args?.name
          const added = addSkillToState(state, skillName)
          if (added) {
            appendEntry(directory, { ts: ts(), agent: state.agentName, action: "skill-loaded", skill: skillName, source: "skill-tool" })
          }
          return
        }

        // Track skill loads via reading SKILL.md (fallback)
        if (tool === "read") {
          const filePath = input?.args?.filePath ?? ""
          const match = filePath.match(/[/\\]skills[/\\]([^/\\]+)[/\\]SKILL\.md$/i)
          if (match) {
            const skillName = match[1]
            const added = addSkillToState(state, skillName)
            if (added) {
              appendEntry(directory, { ts: ts(), agent: state.agentName, action: "skill-loaded", skill: skillName, source: "read-skill-file" })
            }
          }
          return
        }

        const args = input?.args ?? {}

        // Track ensemble tool calls
        const ensembleHandler = ENSEMBLE_TOOL_HANDLERS[tool]
        if (!ensembleHandler) return

        const entry = { ts: ts(), agent: state.agentName, ...ensembleHandler(args) }
        appendEntry(directory, entry)

        if (tool === "team_cleanup") {
          appendEntry(directory, { ts: ts(), agent: state.agentName, action: "team-skills-summary", byAgent: buildTeamSkillsSummary() })
        }
      } catch (_) {}
    },
  }
}

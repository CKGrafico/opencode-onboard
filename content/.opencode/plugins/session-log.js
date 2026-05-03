import fs from "node:fs"
import path from "node:path"

const LOG_FILE = ".agents/session-log.json"

// Per-session state: editCount and skills loaded
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

          sessionState.set(sessionId, { agentName, editCount: 0, skills: [] })
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

          const { agentName, editCount, skills } = state
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

        if (input?.tool === "read") {
          const filePath = input?.args?.filePath ?? ""
          const match = filePath.match(/[/\\]skills[/\\]([^/\\]+)[/\\]SKILL\.md$/i)
          if (match) {
            const skillName = match[1]
            if (!state.skills.includes(skillName)) state.skills.push(skillName)
            appendEntry(directory, { ts: ts(), agent: state.agentName, action: "skill-loaded", skill: skillName })
          }
        }
      } catch (_) {}
    },
  }
}

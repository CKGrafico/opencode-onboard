import fs from "node:fs"
import path from "node:path"

const LOG_FILE = ".agents/session-log.md"
const LOG_HEADER = "# Session Log\n\n| Timestamp | Agent | Action | Detail |\n|-----------|-------|--------|--------|\n"

// Per-session state: editCount and skills loaded
const sessionState = new Map()

function ts() {
  return new Date().toISOString()
}

function appendLog(directory, row) {
  const logPath = path.join(directory, LOG_FILE)
  const dir = path.dirname(logPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, LOG_HEADER, "utf8")
  fs.appendFileSync(logPath, row + "\n", "utf8")
}

function resolveAgentName(session) {
  // session.agent is the path to the agent .md file, e.g. ".agents/agents/back-engineer.md"
  const agentPath = session?.agent
  if (agentPath) {
    const base = path.basename(agentPath, ".md")
    if (base) return base
  }
  // Fall back to session title (ensemble sets it to agent name)
  const title = session?.title
  if (title) return title
  return "lead"
}

export const SessionLogPlugin = async ({ client, directory }) => {
  return {
    "session.created": async ({ event }) => {
      try {
        const sessionId = event.properties?.sessionID
        if (!sessionId) return

        const res = await client.session.get({ path: { id: sessionId } })
        const session = res?.data
        const agentName = resolveAgentName(session)

        sessionState.set(sessionId, { agentName, editCount: 0, skills: [] })

        appendLog(
          directory,
          `| ${ts()} | ${agentName} | started | session ${sessionId.slice(0, 8)} |`
        )
      } catch (_) {}
    },

    "tool.execute.after": async ({ event }) => {
      try {
        const { sessionID, tool, output } = event.properties ?? {}
        if (!sessionID) return

        const state = sessionState.get(sessionID)
        const agentName = state?.agentName ?? "unknown"

        // Skill detection: agent read a SKILL.md
        if (tool === "read") {
          const filePath = output?.args?.filePath ?? output?.input?.filePath ?? ""
          const match = filePath.match(/[/\\]skills[/\\]([^/\\]+)[/\\]SKILL\.md$/i)
          if (match) {
            const skillName = match[1]
            if (state && !state.skills.includes(skillName)) {
              state.skills.push(skillName)
            }
            appendLog(
              directory,
              `| ${ts()} | ${agentName} | skill-loaded | ${skillName} |`
            )
          }
        }
      } catch (_) {}
    },

    "file.edited": async ({ event }) => {
      try {
        const { sessionID } = event.properties ?? {}
        if (!sessionID) return
        const state = sessionState.get(sessionID)
        if (state) state.editCount++
      } catch (_) {}
    },

    "session.idle": async ({ event }) => {
      try {
        const sessionId = event.properties?.sessionID
        if (!sessionId) return

        const state = sessionState.get(sessionId)
        if (!state) return

        const { agentName, editCount, skills } = state
        const skillsSummary = skills.length > 0 ? skills.join(", ") : "none"

        appendLog(
          directory,
          `| ${ts()} | ${agentName} | completed | ${editCount} files edited, skills: ${skillsSummary} |`
        )

        sessionState.delete(sessionId)
      } catch (_) {}
    },
  }
}

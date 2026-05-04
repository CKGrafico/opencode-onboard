import fs from "node:fs"
import path from "node:path"

const LOG_FILE = ".agents/session-log.json"
const SPAWN_MATCH_WINDOW_MS = 15000
const DEBUG = process.env.SESSION_LOG_DEBUG === "true"

// Per-session state
const sessionState = new Map()

// Lead session -> current team name
const leadTeamBySession = new Map()

// Pending spawn records waiting for a session.created match
const pendingSpawns = []

// Team -> completed session snapshots
const completedByTeam = new Map()

function ts() {
  return new Date().toISOString()
}

function nowMs() {
  return Date.now()
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

function toNum(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v)
  return null
}

function extractReportedTokens(obj) {
  const out = { input: 0, output: 0, total: 0, found: false }
  const visited = new Set()

  function walk(node) {
    if (!node || typeof node !== "object") return
    if (visited.has(node)) return
    visited.add(node)

    for (const [k, v] of Object.entries(node)) {
      const key = String(k).toLowerCase()
      const n = toNum(v)

      if (n !== null) {
        if ((key.includes("input") || key.includes("prompt")) && key.includes("token")) {
          out.input += n
          out.found = true
        } else if ((key.includes("output") || key.includes("completion")) && key.includes("token")) {
          out.output += n
          out.found = true
        } else if (key.includes("total") && key.includes("token")) {
          out.total += n
          out.found = true
        }
      }

      if (v && typeof v === "object") walk(v)
    }
  }

  walk(obj)
  return out
}

function estimateTokens(state) {
  const inTokens = Math.ceil((state.charIn || 0) / 4)
  const outTokens = Math.ceil((state.charOut || 0) / 4)
  const base = inTokens + outTokens + Math.max(0, (state.toolCalls || 0) * 20)
  const low = Math.max(0, Math.floor(base * 0.7))
  const high = Math.max(low, Math.ceil(base * 1.4))
  return { low, high }
}

function usagePayload(state) {
  const est = estimateTokens(state)
  const reportedIn = state.reportedInputTokens || 0
  const reportedOut = state.reportedOutputTokens || 0
  const reportedTotalDirect = state.reportedTotalTokens || 0
  const reportedTotalDerived = reportedIn + reportedOut
  const reportedTotal = reportedTotalDirect || reportedTotalDerived || 0

  let method = "heuristic"
  if (reportedTotal > 0 && (est.low > 0 || est.high > 0)) method = "mixed"
  else if (reportedTotal > 0) method = "reported"

  return {
    inputTokensReported: reportedIn || null,
    outputTokensReported: reportedOut || null,
    totalTokensReported: reportedTotal || null,
    tokenEstimateLow: est.low,
    tokenEstimateHigh: est.high,
    method,
  }
}

function buildCompletedSnapshot(state, sessionId) {
  return {
    sessionId,
    agent: state.agentName,
    member: state.member || null,
    agentType: state.agentType || null,
    team: state.teamName || null,
    skills: Array.from(state.skills || []).sort(),
    usage: usagePayload(state),
    filesEdited: state.editCount || 0,
  }
}

function buildTeamSkillsSummary(teamName) {
  const rows = completedByTeam.get(teamName) || []
  const byAgent = {}
  for (const row of rows) {
    const key = row.member || row.agent || "unknown"
    if (!byAgent[key]) byAgent[key] = { agentType: row.agentType || null, skills: new Set() }
    for (const s of row.skills || []) byAgent[key].skills.add(s)
  }
  const out = {}
  for (const [k, v] of Object.entries(byAgent)) {
    out[k] = {
      agentType: v.agentType,
      skills: Array.from(v.skills).sort(),
    }
  }
  return out
}

function trackCompletedByTeam(snapshot) {
  if (!snapshot.team) return
  if (!completedByTeam.has(snapshot.team)) completedByTeam.set(snapshot.team, [])
  completedByTeam.get(snapshot.team).push(snapshot)
}

function enqueuePendingSpawn(leadSessionId, args) {
  pendingSpawns.push({
    leadSessionId,
    at: nowMs(),
    member: args?.name || null,
    agentType: args?.agent || null,
    teamName: leadTeamBySession.get(leadSessionId) || null,
  })
}

function matchPendingSpawn() {
  const now = nowMs()
  // Drop expired pending spawns first
  for (let i = pendingSpawns.length - 1; i >= 0; i--) {
    if (now - pendingSpawns[i].at > SPAWN_MATCH_WINDOW_MS) pendingSpawns.splice(i, 1)
  }
  if (pendingSpawns.length === 0) return null
  return pendingSpawns.shift()
}

// Maps ensemble tool name -> function that extracts log entry fields from args
const ENSEMBLE_TOOL_HANDLERS = {
  team_create:         (args) => ({ action: "team-created", team: args.name }),
  team_spawn:          (args) => ({ action: "teammate-spawned", name: args.name, agentType: args.agent }),
  team_shutdown:       (args) => ({ action: "teammate-shutdown", name: args.name }),
  team_merge:          (args) => ({ action: "teammate-merged", name: args.name }),
  team_cleanup:        () => ({ action: "team-cleanup" }),
  team_status:         () => ({ action: "team-status-checked" }),
  team_results:        (args) => ({ action: "team-results-read", from: args.from }),
  team_message:        (args) => ({ action: "team-message", to: args.to ?? "lead", preview: String(args.text ?? "").slice(0, 120) }),
  team_broadcast:      (args) => ({ action: "team-broadcast", preview: String(args.text ?? "").slice(0, 120) }),
  team_tasks_add:      (args) => ({ action: "tasks-added", count: Array.isArray(args.tasks) ? args.tasks.length : "?" }),
  team_tasks_complete: (args) => ({ action: "task-completed", taskId: args.task_id }),
  team_claim:          (args) => ({ action: "task-claimed", taskId: args.task_id }),
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
          const fallbackAgent = resolveAgentName(session)
          const spawnMatch = matchPendingSpawn()

          const state = {
            agentName: spawnMatch?.member || fallbackAgent,
            member: spawnMatch?.member || null,
            agentType: spawnMatch?.agentType || null,
            teamName: spawnMatch?.teamName || null,
            editCount: 0,
            skills: new Set(),
            startedAtMs: nowMs(),
            toolCalls: 0,
            charIn: 0,
            charOut: 0,
            reportedInputTokens: 0,
            reportedOutputTokens: 0,
            reportedTotalTokens: 0,
          }

          sessionState.set(sessionId, state)
          appendEntry(directory, {
            ts: ts(),
            agent: state.agentName,
            member: state.member,
            agentType: state.agentType,
            team: state.teamName,
            action: "started",
            sessionId,
          })
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

          const skills = Array.from(state.skills || []).sort()
          const usage = usagePayload(state)
          appendEntry(directory, {
            ts: ts(),
            agent: state.agentName,
            member: state.member,
            agentType: state.agentType,
            team: state.teamName,
            action: "completed",
            filesEdited: state.editCount,
            skills,
            usage,
          })

          trackCompletedByTeam(buildCompletedSnapshot(state, sessionId))
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
        const args = input?.args ?? {}

        state.toolCalls++
        state.charIn += JSON.stringify(args).length
        state.charOut += JSON.stringify(output ?? {}).length

        const reportedIn = extractReportedTokens(input)
        const reportedOut = extractReportedTokens(output)
        if (reportedIn.found) {
          state.reportedInputTokens += reportedIn.input
          state.reportedOutputTokens += reportedIn.output
          state.reportedTotalTokens += reportedIn.total
        }
        if (reportedOut.found) {
          state.reportedInputTokens += reportedOut.input
          state.reportedOutputTokens += reportedOut.output
          state.reportedTotalTokens += reportedOut.total
        }

        if (DEBUG && !reportedIn.found && !reportedOut.found && tool !== "read") {
          appendEntry(directory, {
            ts: ts(),
            agent: state.agentName,
            action: "debug-no-token-metrics",
            tool,
          })
        }

        // Track skill loads via skill tool (primary)
        if (tool === "skill") {
          const skillName = input?.args?.name
          const added = addSkillToState(state, skillName)
          if (added) {
            appendEntry(directory, {
              ts: ts(),
              agent: state.agentName,
              member: state.member,
              agentType: state.agentType,
              team: state.teamName,
              action: "skill-loaded",
              skill: skillName,
              source: "skill-tool",
            })
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
              appendEntry(directory, {
                ts: ts(),
                agent: state.agentName,
                member: state.member,
                agentType: state.agentType,
                team: state.teamName,
                action: "skill-loaded",
                skill: skillName,
                source: "read-skill-file",
              })
            }
          }
          return
        }

        // Track ensemble tool calls
        const ensembleHandler = ENSEMBLE_TOOL_HANDLERS[tool]
        if (!ensembleHandler) return

        const entry = {
          ts: ts(),
          agent: state.agentName,
          member: state.member,
          agentType: state.agentType,
          team: state.teamName,
          ...ensembleHandler(args),
        }
        appendEntry(directory, entry)

        if (tool === "team_create") {
          leadTeamBySession.set(sessionId, args?.name || null)
          state.teamName = args?.name || state.teamName
        }

        if (tool === "team_spawn") {
          enqueuePendingSpawn(sessionId, args)
        }

        if (tool === "team_cleanup") {
          const teamName = state.teamName || leadTeamBySession.get(sessionId)
          appendEntry(directory, {
            ts: ts(),
            agent: state.agentName,
            action: "team-skills-summary",
            team: teamName || null,
            byAgent: teamName ? buildTeamSkillsSummary(teamName) : {},
          })
        }
      } catch (_) {}
    },
  }
}

// ob-subagent-monitor
//
// Maintains a live view of spawned subagents in `.opencode/.ob-run.json`:
//   { updatedAt, agents: { <sessionId>: { agent, model, tasks, title, status, startedAt, endedAt } } }
//
// Two jobs from one file:
//   1. Live monitor — the lead reflects this into its native Todo list; you can
//      also navigate the subagents directly with ctrl+x ↓ and ←/→.
//   2. Crash-recovery fallback — /ob-apply reads it on resume when basic-memory
//      is unavailable, to rebuild which tasks were in flight.
//
// This plugin only OBSERVES session lifecycle. Subagents are a black box mid-run
// (no streaming), so status is coarse: running -> done. It never throws — a
// monitor failure must not break a session.

import fs from "node:fs/promises"
import path from "node:path"

export const ObSubagentMonitor = async ({ directory, client }) => {
  const root = directory || process.cwd()
  const statePath = path.join(root, ".opencode", ".ob-run.json")
  const onboardPath = path.join(root, ".opencode", "opencode-onboard.json")

  const state = { updatedAt: null, agents: {} }
  let models = null

  async function loadModels() {
    if (models) return models
    try {
      const raw = await fs.readFile(onboardPath, "utf-8")
      models = JSON.parse(raw)?.wizard?.models ?? {}
    } catch {
      models = {}
    }
    return models
  }

  // Derive the model from a tier-variant agent name, e.g. "backend-engineer-build".
  function modelForAgent(agent) {
    if (!agent) return null
    const m = /-(build|fast)$/.exec(agent)
    return m ? (models?.[m[1]] ?? null) : null
  }

  // Tasks are encoded at the front of the spawn description, e.g.
  // "1.1, 1.2 — ProjectManager" -> ["1.1", "1.2"].
  function parseTasks(title) {
    if (!title) return []
    const m = /^\s*([\d]+(?:\.[\d]+)*(?:\s*,\s*[\d]+(?:\.[\d]+)*)*)/.exec(title)
    return m ? m[1].split(",").map(s => s.trim()) : []
  }

  async function persist() {
    state.updatedAt = new Date().toISOString()
    try {
      await fs.mkdir(path.dirname(statePath), { recursive: true })
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf-8")
    } catch {
      // best-effort; never break the session over the monitor
    }
  }

  function sessionInfo(props) {
    // tolerate both {info:{...}} and flat {...} event shapes
    const info = props?.info ?? props ?? {}
    return {
      id: info.id ?? info.sessionID ?? props?.sessionID,
      parentID: info.parentID ?? info.parentId,
      agent: info.agent,
      title: info.title,
    }
  }

  return {
    event: async ({ event }) => {
      try {
        if (!event?.type?.startsWith("session.")) return
        await loadModels()
        const info = sessionInfo(event.properties)
        if (!info.id) return

        if (event.type === "session.created" && info.parentID) {
          state.agents[info.id] = {
            agent: info.agent ?? null,
            model: modelForAgent(info.agent),
            tasks: parseTasks(info.title),
            title: info.title ?? null,
            status: "running",
            startedAt: new Date().toISOString(),
            endedAt: null,
          }
          await persist()
          return
        }

        const entry = state.agents[info.id]
        if (!entry) return

        if (event.type === "session.idle" && entry.status === "running") {
          entry.status = "done"
          entry.endedAt = new Date().toISOString()
          await persist()
          client?.tui?.showToast?.({
            message: `subagent done: ${entry.title ?? info.id}`,
            variant: "success",
          })
        }
      } catch {
        // swallow: monitoring must never disrupt the run
      }
    },
  }
}

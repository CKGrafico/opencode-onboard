# Replace basic-memory with Agentmemory as the local shared memory system

## Why

basic-memory requires `uv` (Python toolchain), runs as a stdio MCP with no shared server, has no local viewer, no auto-capture hooks, and no multi-agent coordination. The user reports it is "horrible, never working as expected." Agentmemory (https://github.com/rohitg00/agentmemory) provides a persistent local server on localhost:3111, 53 MCP tools, local embeddings (all-MiniLM-L6-v2), a real-time viewer on :3113, 22 OpenCode auto-capture hooks, session replay, multi-agent shared memory, and requires only npm (no Python/uv). It is a drop-in replacement that is simpler, more capable, and aligns with the Node.js ecosystem.

## What Changes

1. **Replace `src/steps/optimization/memory.js`** — rewrite the installer to install `@agentmemory/agentmemory` via npm instead of basic-memory via uv. Configure the MCP server in `opencode.json` as `agentmemory` (not `basic-memory`) pointing at `npx -y @agentmemory/mcp` with `AGENTMEMORY_URL=http://localhost:3111`. Add the agentmemory skills to `skills-lock.json`.

2. **Update `src/presets/optimization.json`** — rename the checklist item from "basic-memory knowledge graph (requires uv)" to "agentmemory local memory server".

3. **Update `src/commands/join.js`** — replace basic-memory health check with agentmemory server health check (`curl http://localhost:3111/agentmemory/health` or `npx @agentmemory/agentmemory doctor`).

4. **Update `src/presets/guardrails/memory.md`** — replace basic-memory MCP tool references with agentmemory MCP tools (`memory_smart_search`, `memory_save`, `memory_sessions`, `memory_governance_delete`).

5. **Update all content templates** that reference "basic-memory" — replace with "agentmemory" across command files (`plan-apply.md`, `plan-explore.md`, `plan-propose.md`, `plan-quick.md`, `plan-goal.md`, `make-architecture.md`, `make-design.md`, `make-guardrails.md`) and the guardrails skill (`ob-guardrails-generic/SKILL.md`).

6. **Update `content/skills-lock.json`** — replace the basic-memory entry with agentmemory skills entry (`rohitg00/agentmemory`).

7. **Update `content/.opencode/opencode.json`** — add the agentmemory MCP server to the template (optional, since the installer writes it dynamically, but having it in the template ensures it's present even without running the optimization step).

## Non-goals

- Building new slash commands (`/memory-status`, `/memory-recall`, etc.) — those can be a follow-up change
- Secret redaction pre-write filter — follow-up
- Agent identity wrapper scripts — follow-up
- Docker Compose deployment — follow-up
- OpenCode plugin (22 hooks) installation — follow-up; the MCP server + skills is the minimum viable integration

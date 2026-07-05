---
description: Quick direct implementation, no OpenSpec, no subagent waves, no PRs. Just do it.
---

Implement the task described after `/ob-main` directly and immediately.

Apply `## Optimizations` from AGENTS.md (RTK, codegraph, memory, etc.).
<!-- OB-CMD-RTK-START -->
Prefix all bash commands with `rtk` when RTK is enabled.
<!-- OB-CMD-RTK-END -->

**Rules:**
- No OpenSpec artifacts (no proposal, no specs, no tasks.md)
- No subagent waves (work in this session only)
- No branches, no PRs
- Work directly in the current branch
- Keep changes minimal and focused on exactly what was asked
- Use Read/Glob/Grep to locate relevant files before editing

<!-- OB-CMD-CODEGRAPH-START -->
- Use codegraph MCP tools (NOT CLI commands). Do NOT run `codegraph` in bash. Use `codegraph_search` MCP tool to locate relevant symbols and understand the code structure before editing.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
- Use basic-memory MCP `search` tool (NOT CLI) for any prior context notes relevant to the area you're working in.
<!-- OB-CMD-MEMORY-END -->

- After editing, run the project's typecheck/build check if one exists (look for a `typecheck`/`check`/`build` script in package.json, or the language's native check like `tsc --noEmit`, `go build`, `cargo check`); fix any errors caused by your changes. If the project has no such check, skip this.
- Do NOT run lint or tests unless the user asks

**Input**: Everything after `/ob-main` is the task. Execute it now. 

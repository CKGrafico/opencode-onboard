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
- Use codegraph MCP `codegraph_search` to locate relevant symbols and understand the code structure before editing — faster and more accurate than blind grep.
<!-- OB-CMD-CODEGRAPH-END -->

<!-- OB-CMD-MEMORY-START -->
- Use basic-memory MCP `search` for any prior context notes relevant to the area you're working in.
<!-- OB-CMD-MEMORY-END -->

- After editing, run `pnpm run typecheck` to catch type errors; fix any that are caused by your changes
- Do NOT run lint or tests unless the user asks

**Input**: Everything after `/ob-main` is the task. Execute it now. 

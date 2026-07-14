## CodeGraph

- If `codegraph_explore` is available in your tools, use it BEFORE grep/read to understand or locate code. One call returns the relevant symbols' verbatim source plus the call paths between them.
- Do NOT run `codegraph` in bash: it is an MCP server, not a CLI tool.
- If codegraph is not available, use standard grep/glob/read for code exploration.
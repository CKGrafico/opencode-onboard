## CodeGraph

- Use `codegraph_explore` FIRST before grep/read to understand or locate code. One call returns the relevant symbols' verbatim source plus the call paths between them.
- If you reach for grep/glob/read instead of `codegraph_explore`, you MUST tell the user why (e.g. "codegraph is not indexed for this repo" or "searching for a string pattern that codegraph doesn't index").
- Do NOT run `codegraph` in bash: it is an MCP server, not a CLI tool.

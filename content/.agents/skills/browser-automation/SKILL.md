---
name: browser-automation
description: Reliable, composable browser automation using OpenCode Browser primitives. Use when capturing screenshots of a locally running app, clicking UI elements, reading page content, or automating browser interactions on localhost.
license: MIT
compatibility: Requires opencode-browser extension installed and running.
metadata:
  author: copilots
  version: "1.0"
---

Browser MCP tools are permitted ONLY for interactions with the LOCAL running app on `localhost` URLs.
**Navigating to external services (github.com, dev.azure.com, etc.) via browser MCP is FORBIDDEN.**

---

## Best-practice workflow

1. Inspect tabs with `browser_get_tabs`
2. Open new tabs with `browser_open_tab` when needed
3. Navigate with `browser_navigate` if needed
4. Wait for UI using `browser_query` with `timeoutMs`
5. Discover candidates using `browser_query` with `mode=list`
6. Click, type, or select using `index`
7. Confirm using `browser_query` or `browser_snapshot`

---

## CLI-first debugging

- List all available tools: `npx @different-ai/opencode-browser tools`
- Run one tool directly: `npx @different-ai/opencode-browser tool browser_status`
- Pass JSON args: `npx @different-ai/opencode-browser tool browser_query --args '{"mode":"page_text"}'`
- Run smoke test: `npx @different-ai/opencode-browser self-test`
- After `update`, reload the unpacked extension in `chrome://extensions`

---

## Selecting options

- Use `browser_select` for native `<select>` elements
- Prefer `value` or `label`; use `optionIndex` when needed
- Example: `browser_select({ selector: "select", value: "plugin" })`

---

## Query modes

- `text`: read visible text from a matched element
- `value`: read input values
- `list`: list many matches with text/metadata
- `exists`: check presence and count
- `page_text`: extract visible page text

---

## Opening tabs

- Use `browser_open_tab` to create a new tab, optionally with `url` and `active`
- Example: `browser_open_tab({ url: "https://example.com", active: false })`

---

## Troubleshooting

- If a selector fails, run `browser_query` with `mode=page_text` to confirm the content exists
- Use `mode=list` on broad selectors (`button`, `a`, `*[role="button"]`, `*[role="listitem"]`) and choose by index
- For inbox/chat panes, try text selectors first (`text:Subject line`) then verify selection with `browser_query`
- For scrollable containers, pass both `selector` and `x`/`y` to `browser_scroll` and then verify `scrollTop`
- Confirm results after each action

---

## Guardrails

- ✅ Screenshots of locally running app on `localhost` URLs
- ✅ Click, type, scroll, query on `localhost` pages
- ❌ Navigate to external services (github.com, dev.azure.com, npmjs.com, etc.) — FORBIDDEN
- ❌ Use browser tools for any DevOps or GitHub operations — FORBIDDEN
- ❌ Use browser tools to read or modify production systems — FORBIDDEN

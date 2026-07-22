# Evidence contract

Evidence lives at `openspec/changes/<id>/evidence/` (travels with the change on archive). That folder contains only:
- ordered capture images (`01-{label}.png/webp`, ...) and/or `flow.gif`
- `evidence.json`: the manifest, schema below.

## version 1 schema

```jsonc
{
  "version": 1,
  "changeId": "...",
  "required": true,
  "status": "passed",            // passed | skipped | failed | blocked
  "assets": [ { "type": "screenshot", "path": "openspec/changes/<id>/evidence/01-final.png", "caption": "...", "bytes": 0, "format": "png" } ],
  "reason": "...",                 // skipped | blocked
  "failedStep": "...",             // failed
  "prMarkdown": "## Evidence ..."
}
```

## Statuses

- `passed`: evidence required and produced.
- `skipped`: evidence not required (see decision rule). Exit success.
- `blocked`: required but could not run (no harness, app won't start, budget exceeded). Not a skip. Surface it.
- `failed`: a project harness ran and its assertions failed. Surface it.

`blocked` (required but unrunnable) is never treated as a skip.

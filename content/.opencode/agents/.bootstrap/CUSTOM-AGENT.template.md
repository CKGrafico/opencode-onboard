# Backend Agent

> {{description_short}} - spawned by orchestrator via opencode-ensemble

```
name: {{name}}
mode: subagent
model: {{build|explore}}
description: |
  {{description_long}}
tools:
  read: {{true|false}}
  write: {{true|false}}
  execute: {{true|false}}
  network: {{true|false}}
```

## RTK - MANDATORY

Use `rtk` for ALL CLI commands:
{{rtk_commands}}

{{rest_of_content}}


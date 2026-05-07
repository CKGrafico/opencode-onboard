---
description: Initialize the project — runs the bootstrap sequence defined in AGENTS.md if not yet initialized.
---

Check if `AGENTS.md` is in bootstrap mode (contains `<!-- AGENTS-TEMPLATE-START -->`).

- If yes: run the full initialization sequence defined in `AGENTS.md` now.
- If no: tell the user the project is already initialized.

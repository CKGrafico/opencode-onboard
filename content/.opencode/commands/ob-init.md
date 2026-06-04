---
description: Initialize the project. Runs the bootstrap sequence defined in AGENTS.md if not yet initialized. Supports both greenfield and brownfield projects.
---

Check if `AGENTS.md` is in bootstrap mode (contains `<!-- AGENTS-TEMPLATE-START -->`).

- If yes: run the full initialization sequence defined in `AGENTS.md` now. The sequence will ask whether this is a greenfield or brownfield project and branch accordingly.
- If no: tell the user the project is already initialized. Suggest running `/ob-create-architecture` or `/ob-create-design` if they want to refresh those docs.

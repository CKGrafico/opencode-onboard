---
description: Set the model for a tier (plan, build, or fast) in opencode-onboard.json and re-stamp engineers on that tier.
---

Set the concrete model for one tier in `.opencode/opencode-onboard.json` → `wizard.models`, then re-stamp the `model:` line of every engineer assigned to that tier (one file per engineer — no variants), so the change takes effect on your next `/ob-apply`.

Usage:

```
/ob-set-model <tier> <model>
```

- `<tier>` — one of `plan`, `build`, `fast`.
- `<model>` — a fully-qualified model id (e.g. `opencode/big-pickle`) OR the keyword `current` to use the model active in this session.

Arguments: `$ARGUMENTS`

**Steps**

1. **Parse `$ARGUMENTS`** by whitespace: first token = `<tier>`, second token = `<model>`.
   - If `$ARGUMENTS` is empty: read `.opencode/opencode-onboard.json` and show the current `wizard.models` mapping (`plan`, `build`, `fast` → id, or `unset`), then show the usage above. Change nothing.
   - If `<tier>` is not exactly one of `plan` / `build` / `fast`, or `<model>` is missing: print the usage and stop. Change nothing.

2. **Resolve `<model>`:**
   - If it is the literal `current`: use the model id active in THIS session (as shown in the opencode status line). Never substitute a guessed model.
   - Otherwise use the value verbatim. It must look like `provider/model-id`. If it contains no `/`, warn that it looks malformed and ask the user to confirm before writing.

3. **Read `.opencode/opencode-onboard.json`.** If it does not exist, stop and tell the user onboarding has not generated it yet.

4. **Update the config.** Note the PREVIOUS value of `wizard.models.<tier>` (needed in step 5). Then set `wizard.models.<tier>` to the resolved model id (create `wizard.models` if absent). Do NOT touch any other field. Preserve the existing 2-space JSON formatting, then write the file back.

5. **Re-stamp engineers on that tier.** There are no variant files — each engineer is a single agent file carrying its own `model:`. For every `*-engineer.md` in `.opencode/agents/` whose current `model:` equals the tier's PREVIOUS value (from step 4), set its `model:` to the new id. By convention `basic-engineer` is the `fast` tier. For tier `plan` (the lead/primary session model) there is usually no engineer file to change — tell the user to select it when launching opencode.

6. **Confirm:**

   ```
   opencode-onboard.json updated
     <tier> model -> <resolved-id>
     re-stamped: <list of engineer files updated>
   ```

   It takes effect on your next `/ob-apply`: engineers on that tier now carry the new model. No restart required.

**This command edits `.opencode/opencode-onboard.json` and the `model:` line of engineer files on that tier.** It never modifies `opencode.json` or `tasks.md`.

---
description: Set the model for a tier (plan, build, or fast) in opencode-onboard.json and regenerate agent variants.
---

Set the concrete model for one tier in `.opencode/opencode-onboard.json` → `wizard.models`. For `build`/`fast` this also regenerates the tier-variant agent files (`<engineer>-build` / `<engineer>-fast`) that carry the model, so the change takes effect on your next `/ob-apply`.

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

4. **Set `wizard.models.<tier>`** to the resolved model id (create `wizard.models` if absent). Do NOT touch any other field. Preserve the existing 2-space JSON formatting, then write the file back.

5. **Regenerate variants (only for `build` / `fast`).** For every base engineer file in `.opencode/agents/` matching `*-engineer.md` that is NOT itself a `-build`/`-fast` variant:
   - Write `<engineer-name>-<tier>.md` with the same body as the base file, but with `model: <resolved-id>` set in its YAML frontmatter (replace an existing `model:` line, or add one).
   - For tier `plan` there is no variant to regenerate — `plan` is the lead/primary session model. Tell the user to select it when launching opencode (or set it as the default in `.opencode/opencode.json`).

6. **Confirm:**

   ```
   opencode-onboard.json updated
     <tier> model -> <resolved-id>
     regenerated: <list of *-<tier>.md variants>   (build/fast only)
   ```

   It takes effect on your next `/ob-apply`: tasks annotated `modeltype: <tier>` resolve to the `<agent>-<tier>` variant, which now carries this model. No restart required.

**This command edits `.opencode/opencode-onboard.json` and the `*-build` / `*-fast` agent variant files.** It never modifies `opencode.json`, base agent files, or `tasks.md`.

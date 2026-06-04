---
description: Generate or regenerate DESIGN.md by analyzing the codebase design system. Safe to run at any time.
---

Analyze the design system of this codebase and generate a populated `DESIGN.md` in the project root.

Reference material:
  Overview : https://stitch.withgoogle.com/docs/design-md/overview/
  Format   : https://stitch.withgoogle.com/docs/design-md/format/
  Spec     : https://github.com/google-labs-code/design.md

Examples from the spec repo:
  https://github.com/google-labs-code/design.md/blob/main/examples/atmospheric-glass/DESIGN.md
  https://github.com/google-labs-code/design.md/blob/main/examples/paws-and-paths/DESIGN.md

**Steps**

1. **Check current state**

   Read `DESIGN.md`. If it already contains real content (not the placeholder), warn the user:
   > "DESIGN.md already has content. Running this will overwrite it. Proceeding..."

   Then continue regardless — this command is always safe to rerun.

2. **Check for source roots**

   Load `.agents/source-roots.json` when present. Only analyze those roots.

3. **Analyze the codebase**

   Look for:
   - CSS files, Tailwind config, PostCSS config
   - Component files with inline styles or class usage
   - Design token definitions (JS/TS/JSON/YAML)
   - Theme files or style constants
   - UI framework config (shadcn, MUI, Chakra, etc.)

   If access to a running local server or screenshots is available, use them to validate visual identity.

4. **Write DESIGN.md**

   Overwrite `DESIGN.md` with the result. The output must:
   - Begin with YAML frontmatter containing all structured design tokens (colors, typography, spacing, elevation, motion, radii, shadows, etc.)
   - Follow with free-form Markdown describing the look & feel and capturing design intent that token values alone cannot convey
   - Be entirely self-contained — do not reference any files, variables, or paths from the codebase
   - Use valid YAML design token format for all token values

5. **Report**

   Tell the user:
   - `DESIGN.md` generated successfully
   - Key design tokens found (color palette, fonts, spacing scale)
   - Tip: "Rerun `/ob-create-design` any time your design system changes."

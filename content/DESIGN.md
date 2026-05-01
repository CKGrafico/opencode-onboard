> Execute this command

Analyze the design system of this codebase with the goal of creating a DESIGN.md file in the project root and giving the user a file for easy copy & pasting.

Reference material:
  Overview : https://stitch.withgoogle.com/docs/design-md/overview/
  Format   : https://stitch.withgoogle.com/docs/design-md/format/
  Spec     : https://github.com/google-labs-code/design.md

Examples from the spec repo:
  https://github.com/google-labs-code/design.md/blob/main/examples/atmospheric-glass/DESIGN.md
  https://github.com/google-labs-code/design.md/blob/main/examples/paws-and-paths/DESIGN.md

Requirements:
- Begin with YAML frontmatter containing all structured design tokens
  (colors, typography, spacing, elevation, motion, radii, shadows, etc.)
- Follow with free-form Markdown that describes the look & feel and
  captures design intent that token values alone cannot convey
- The file must be entirely self-contained — do not reference any
  files, variables, or paths from the codebase
- All token values must use valid YAML design token format

If you have access to a running local server or screenshots of the
product, compare your DESIGN.md against the rendered UI. Revise until
both the YAML tokens and the written description faithfully capture
the product's visual identity.
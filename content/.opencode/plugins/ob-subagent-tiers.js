// ob-subagent-tiers
//
// On startup, reads *-engineer.md agent files (templates with no model) and
// creates tier variant files (*-engineer.build.md, *-engineer.fast.md,
// *-engineer.plan.md) on disk, each with the model resolved from wizard.models.
// Then also injects them into cfg.agent in-memory for immediate availability.
//
// Model resolution priority:
//   1. `.opencode/opencode-onboard.user.json` → wizard.models  (user override, gitignored)
//   2. `.opencode/opencode-onboard.json`      → wizard.models  (team shared)
//   3. unset → variant not created (the template inherits the lead's model)
//
// The variant files are gitignored (*-engineer.*.md in .opencode/.gitignore)
// and regenerated on every startup — so /ob-set-model + restart picks up
// new models without touching the template files.

import fs from "node:fs/promises"
import path from "node:path"

export const ObSubagentTiers = async ({ directory }) => {
  const root = directory || process.cwd()
  const agentsDir = path.join(root, ".opencode", "agents")

  const TIERS = ["build", "fast", "plan"]

  async function readJson(filePath) {
    try {
      const raw = await fs.readFile(filePath, "utf-8")
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  async function resolveModels() {
    const userPath = path.join(root, ".opencode", "opencode-onboard.user.json")
    const teamPath = path.join(root, ".opencode", "opencode-onboard.json")

    const user = await readJson(userPath)
    const team = await readJson(teamPath)

    const userModels = user?.wizard?.models ?? {}
    const teamModels = team?.wizard?.models ?? {}

    const models = {}
    for (const tier of TIERS) {
      models[tier] = userModels[tier] ?? teamModels[tier] ?? null
    }
    return models
  }

  async function listEngineerTemplates() {
    try {
      const entries = await fs.readdir(agentsDir)
      return entries
        .filter((f) => /^[\w-]+-engineer\.md$/.test(f))
        .map((f) => f.replace(/\.md$/, ""))
    } catch {
      return []
    }
  }

  function buildVariantContent(templateContent, model) {
    const fmMatch = templateContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const modelLine = `model: ${model}`
    if (!fmMatch) return `---\n${modelLine}\n---\n\n${templateContent}`

    const fm = fmMatch[1]
    const newFm = /^model:/m.test(fm)
      ? fm.replace(/^model:.*$/m, modelLine)
      : `${modelLine}\n${fm}`

    // Rebuild by slicing at the matched frontmatter's end. Never String.replace
    // with content-derived strings: it matches the wrong occurrence and expands
    // `$&`-style sequences that may appear in descriptions.
    return `---\n${newFm}\n---${templateContent.slice(fmMatch[0].length)}`
  }

  function templateDescription(templateContent) {
    const m = templateContent.match(/^description:\s*(.+)$/m)
    return m ? m[1].trim() : null
  }

  async function cleanStaleVariants(keepSet) {
    try {
      const entries = await fs.readdir(agentsDir)
      for (const f of entries) {
        const m = f.match(/^(.+)-engineer\.(build|fast|plan)\.md$/)
        if (m && !keepSet.has(f)) {
          await fs.unlink(path.join(agentsDir, f))
        }
      }
    } catch {}
  }

  return {
    config: async (cfg) => {
      try {
        const models = await resolveModels()
        const available = TIERS.filter((t) => models[t])

        const templates = await listEngineerTemplates()

        // Write physical files AND inject in-memory
        const keepSet = new Set()

        for (const name of templates) {
          const templatePath = path.join(agentsDir, `${name}.md`)
          const templateContent = await fs.readFile(templatePath, "utf-8")

          for (const tier of available) {
            const variantFile = `${name}.${tier}.md`
            const variantPath = path.join(agentsDir, variantFile)
            const variantContent = buildVariantContent(templateContent, models[tier])

            await fs.writeFile(variantPath, variantContent, "utf-8")
            keepSet.add(variantFile)

            // Also inject in-memory for immediate availability. If the base
            // agent isn't merged into cfg.agent yet (hook ordering), build a
            // minimal safe definition from the template — never inject a
            // bare `{ model }` that could surface as a primary agent.
            if (cfg?.agent) {
              const base = cfg.agent[name]
              cfg.agent[`${name}.${tier}`] = base
                ? { ...base, model: models[tier] }
                : {
                    mode: "subagent",
                    description: templateDescription(templateContent) ?? `${name} (${tier} tier)`,
                    model: models[tier],
                  }
            }
          }
        }

        // Clean stale variants
        await cleanStaleVariants(keepSet)

        // Log
        const total = templates.length * available.length
        if (total > 0) {
          console.error(`[ob-subagent-tiers] Created ${total} variant files (${templates.length} engineers x ${available.length} tiers)`)
        } else {
          console.error(`[ob-subagent-tiers] No variants created. Models: ${JSON.stringify(models)}`)
        }
      } catch (err) {
        console.error(`[ob-subagent-tiers] Error: ${err.message}`)
      }
    },
  }
}
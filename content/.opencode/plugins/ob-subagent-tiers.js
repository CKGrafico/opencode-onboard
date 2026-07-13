// ob-subagent-tiers
//
// On startup, reads *-engineer.md agent files (templates) and creates tier
// variant files (*-engineer.build.md, *-engineer.fast.md, *-engineer.plan.md)
// on disk with the model resolved from the config, then injects them in-memory.
// Tier variants are always mode: subagent — spawned by /ob-apply, never primary.
//
// Model resolution priority:
//   1. `.opencode/opencode-onboard.user.json` → models  (user override, gitignored)
//   2. `.opencode/opencode-onboard.json`      → models  (team shared)
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

    const [user, team] = await Promise.all([
      readJson(userPath),
      readJson(teamPath),
    ])

    const userModels = user?.models ?? {}
    const teamModels = team?.models ?? {}

    const models = {}
    for (const tier of TIERS) {
      models[tier] = userModels[tier] ?? teamModels[tier] ?? null
    }
    return models
  }

  async function listEngineerTemplatesAndVariants() {
    try {
      const entries = await fs.readdir(agentsDir)
      const templates = entries
        .filter((f) => /^[\w-]+-engineer\.md$/.test(f))
        .map((f) => f.replace(/\.md$/, ""))
      const variantFiles = entries.filter((f) =>
        /^[\w-]+-engineer\.(build|fast|plan)\.md$/.test(f)
      )
      return { templates, variantFiles }
    } catch {
      return { templates: [], variantFiles: [] }
    }
  }

  function buildVariantContent(templateContent, model) {
    const fmMatch = templateContent.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const modelLine = `model: ${model}`
    if (!fmMatch) return `---\nmode: subagent\n${modelLine}\n---\n\n${templateContent}`

    let fm = fmMatch[1]
    // Force mode: subagent on tier variants — they are spawned by /ob-apply, never primary.
    fm = /^mode:/m.test(fm)
      ? fm.replace(/^mode:.*$/m, 'mode: subagent')
      : `mode: subagent\n${fm}`
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

  async function cleanStaleVariants(variantFiles, keepSet) {
    const toRemove = variantFiles.filter((f) => !keepSet.has(f))
    await Promise.all(
      toRemove.map((f) => fs.unlink(path.join(agentsDir, f)).catch(() => {}))
    )
  }

  return {
    config: async (cfg) => {
      try {
        const models = await resolveModels()
        const available = TIERS.filter((t) => models[t])

        const { templates, variantFiles } = await listEngineerTemplatesAndVariants()

        // Read all templates in parallel
        const templateContents = await Promise.all(
          templates.map(async (name) => ({
            name,
            content: await fs.readFile(path.join(agentsDir, `${name}.md`), "utf-8"),
          }))
        )

        const keepSet = new Set()

        // Build all variant contents in memory
        const variantsToWrite = []
        for (const { name, content } of templateContents) {
          for (const tier of available) {
            const variantFile = `${name}.${tier}.md`
            const variantContent = buildVariantContent(content, models[tier])
            variantsToWrite.push({ variantFile, variantContent, name, tier, templateContent: content })
            keepSet.add(variantFile)
          }
        }

        // Write all variant files atomically (tmp+rename) in parallel
        await Promise.all(
          variantsToWrite.map(async ({ variantFile, variantContent }) => {
            const variantPath = path.join(agentsDir, variantFile)
            const tmpPath = `${variantPath}.tmp`
            await fs.writeFile(tmpPath, variantContent, "utf-8")
            await fs.rename(tmpPath, variantPath)
          })
        )

        // Inject in-memory for immediate availability
        if (cfg?.agent) {
          for (const { name, tier, templateContent } of variantsToWrite) {
            const base = cfg.agent[name]
            cfg.agent[`${name}.${tier}`] = base
              ? { ...base, mode: 'subagent', model: models[tier] }
              : {
                mode: "subagent",
                description: templateDescription(templateContent) ?? `${name} (${tier} tier)`,
                model: models[tier],
              }
          }
        }

        // Clean stale variants (uses entries from the single readdir above)
        await cleanStaleVariants(variantFiles, keepSet)

        // Log
        const total = variantsToWrite.length
        if (total > 0) {
          console.error(`[ob-subagent-tiers] Created ${total} variant files (${templates.length} engineers x ${available.length} tiers)`)
        } else if (templates.length > 0) {
          // Only log the "no variants" warning when there ARE engineer templates
          // but no models resolved — that's a real config problem. Skip when
          // there are no templates at all (e.g. global config dir has no agents).
          console.error(`[ob-subagent-tiers] No variants created. Models: ${JSON.stringify(models)}`)
        }
      } catch (err) {
        console.error(`[ob-subagent-tiers] Error: ${err.message}`)
      }
    },
  }
}

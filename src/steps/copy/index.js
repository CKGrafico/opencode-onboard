import fse from "fs-extra"
import path from "path"
import { fileURLToPath } from "url"
import { copyContent } from "../../utils/copy.js"
import { error, header, success } from "../../utils/exec.js"
import { exit } from "../../utils/process.js"
import { patchAgentGuidance, patchAgentsMd, patchConcurrency } from "./agents.js"
import { patchArchiveCommand } from "./commands.js"
import { installSkills } from "./skills.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, "../../../content")

export async function copyContentStep(platform, ctx = {}) {
  header("Step 5, Copying opencode-onboard files")

  const dest = process.cwd()

  // Support both old single-string platform and new { backlogPlatform, repoPlatform }
  const backlogPlatform = typeof platform === 'object' ? platform.backlogPlatform : platform
  const repoPlatform = typeof platform === 'object' ? platform.repoPlatform : platform

  try {
    await copyContent(CONTENT_DIR, dest, platform, ctx)

    // .gitignore is stripped by npm during publish, so the source file is _gitignore.
    // Also, fse.copy with overwrite:false won't overwrite an existing .gitignore,
    // so merge manually to preserve both opencode's defaults and our additions.
    const srcGitignore = path.join(CONTENT_DIR, ".opencode", "_gitignore")
    const destGitignore = path.join(dest, ".opencode", ".gitignore")
    if (await fse.pathExists(srcGitignore)) {
      const srcLines = (await fse.readFile(srcGitignore, "utf-8")).split("\n").map(l => l.trim()).filter(Boolean)
      const destLines = (await fse.pathExists(destGitignore))
        ? (await fse.readFile(destGitignore, "utf-8")).split("\n").map(l => l.trim()).filter(Boolean)
        : []
      const merged = Array.from(new Set([...destLines, ...srcLines]))
      await fse.writeFile(destGitignore, merged.join("\n") + "\n", "utf-8")
    }

    const rootsFile = path.join(dest, ".opencode", "source-roots.json")
    await fse.writeJson(
      rootsFile,
      {
        mode: ctx.sourceMode || "current",
        roots: ctx.sourceRoots || [dest],
      },
      { spaces: 2 },
    )

    await patchAgentGuidance(backlogPlatform, repoPlatform)
    await patchArchiveCommand({ backlogPlatform, repoPlatform })
    await patchAgentsMd(ctx)
    await patchConcurrency(ctx)

    await installSkills(backlogPlatform, repoPlatform)
    success("Files copied to project root")
  } catch (err) {
    error(`Failed to copy content: ${err.message}`)
    exit(1)
  }
}

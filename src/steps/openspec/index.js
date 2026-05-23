import { execa } from "execa"
import path from "node:path"
import { commandExists, error, header, info, loading, success, warn} from "../../utils/exec.js"
import { APPLY_TARGETS, patchApplyFile } from "./ensemble.js"

export const openspecSteps = {
  check,
  install,
  init,
  patch,
}

export async function initOpenspec() {
  header("Step 6, Initializing OpenSpec")

  let openSpec = await openspecSteps.check()
  if (!openSpec.available) {
    await openspecSteps.install()
  }

  openSpec = await openspecSteps.check()
  if (!openSpec.available) {
    warn("OpenSpec has not been installed. It is required to create changes.")
    return { ...openSpec, initialized: false, patched: false }
  }

  const initResult = await openspecSteps.init()
  if (!initResult.initialized) {
    warn(
      "OpenSpec has not been initialized. It is required to create changes.",
    )
    return { ...openSpec, initialized: false, patched: false }
  }

  const patchesResult = await openspecSteps.patch()
  return {
    ...openSpec,
    initialized: true,
    patched: patchesResult.success,
  }
}

async function install() {
  info("Installing OpenSpec...")
  try {
    const result = await execa(
      "npm",
      ["install", "@fission-ai/openspec", "--global"],
      {
        cwd: process.cwd(),
        stdio: "pipe",
        reject: false,
      },
    )
    if (result.exitCode !== 0) {
      warn("OpenSpec install failed, check output above")
    }
    success("OpenSpec installed")
  } catch (err) {
    error(`Failed to run openspec install: ${err.message}`)
  }  
}

async function check() {
  loading("Checking OpenSpec...")

  const available = await commandExists("openspec")

  if (available) success("OpenSpec is available")
  else warn("OpenSpec not found on PATH.")

  return { available }
}

async function init() {
  loading("Initializing OpenSpec...")
  try {
    const result = await execa(
      "npx",
      ["@fission-ai/openspec", "init", "--tools", "opencode", "--force"],
      {
        cwd: process.cwd(),
        stdio: "pipe",
        reject: false,
      },
    )

    if (result.exitCode !== 0) {
      throw new Error(
        `init failed with exit code ${result.exitCode}, check output above`,
      )
    }
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`)
    return { initialized: false }
  }

  success("OpenSpec initialized")
  return { initialized: true }
}

async function patch() {
  loading("Patching OpenSpec ensemble implementation...")

  const patched = []

  for (const rel of APPLY_TARGETS) {
    const abs = path.join(process.cwd(), rel)
    try {
      const res = await patchApplyFile(abs)
      if (res.ok) {
        patched.push(rel)
        success(`Patched ensemble implementation section in ${rel}`)
      } else warn(`Could not patch ${rel} (${res.reason})`)
    } catch (err) {
      warn(`Could not patch ${rel}: ${err.message}`)
    }
  }

  return { success: patched.length === APPLY_TARGETS.length, patched }
}

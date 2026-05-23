import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("execa")
vi.mock("../../utils/exec.js")
vi.mock("./ensemble.js")

import { execa } from "execa"
import { commandExists } from "../../utils/exec.js"
import { patchApplyFile } from "./ensemble.js"
import { initOpenspec } from "./index.js"

const patchSuccess = () => patchApplyFile.mockResolvedValue({ ok: true })
const installFails = () => execa.mockResolvedValueOnce({ exitCode: 1 })
const installSuccess = () => execa.mockResolvedValueOnce({ exitCode: 0 })
const initSuccess = () => execa.mockResolvedValueOnce({ exitCode: 0 })
const initFails = () => execa.mockResolvedValueOnce({ exitCode: 1 })
const checkFails = () => commandExists.mockResolvedValueOnce(false)
const checkSuccess = () => commandExists.mockResolvedValueOnce(true)

describe("initOpenspec()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("installs, initializes, and patches when openspec is initially unavailable", async () => {
    checkFails()
    checkSuccess()
    installSuccess()
    initSuccess()
    patchSuccess()

    const result = await initOpenspec()

    expect(result.available).toBe(true)
    expect(result.initialized).toBe(true)
    expect(result.patched).toBe(true)
  })

  it("fails if openspec remains unavailable after install", async () => {
    checkFails()
    checkFails()
    installFails()

    const result = await initOpenspec()

    expect(result.available).toBe(false)
    expect(result.initialized).toBe(false)
    expect(result.patched).toBe(false)
  })

  it("fails if openspec init command exits non-zero", async () => {
    checkFails()
    checkSuccess()
    installSuccess()
    initFails()

    const result = await initOpenspec()

    expect(result.available).toBe(true)
    expect(result.initialized).toBe(false)
    expect(result.patched).toBe(false)
  })
})

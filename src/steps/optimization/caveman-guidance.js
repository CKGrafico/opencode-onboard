import { info } from '../../utils/exec.js'

export async function enableCavemanGuidance(cavemanResult) {
  if (!cavemanResult?.installed) {
    info('Caveman guidance skipped (caveman not installed)')
    return { enabled: false }
  }

  // Caveman guidance is now injected into ob-guardrails-generic via patchGuardrails
  return { enabled: true, patchedFiles: 0 }
}

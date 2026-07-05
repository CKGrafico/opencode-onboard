import { info } from '../../utils/exec.js'

export async function enableCavemanGuidance(cavemanResult) {
  if (!cavemanResult?.installed) {
    info('Caveman guidance skipped (caveman not installed)')
    return { enabled: false }
  }

  info('Caveman guidance is configured via the AGENTS.md Optimizations markers')
  return { enabled: true, patchedFiles: 0 }
}

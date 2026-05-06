import { info } from '../../utils/exec.js'

export async function enableCavemanGuidance(cavemanResult) {
  if (!cavemanResult?.installed) {
    info('Caveman guidance skipped (caveman not installed)')
    return { enabled: false }
  }

  info('Caveman guidance is configured only via @ob-global skill')
  return { enabled: true, patchedFiles: 0 }
}

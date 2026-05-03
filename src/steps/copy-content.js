import path from 'path'
import { fileURLToPath } from 'url'
import { copyContent } from '../utils/copy.js'
import { error, header, success } from '../utils/exec.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '../../content')

export async function copyContentStep(platform, ctx = {}) {
  header('Step 5, Copying opencode-onboard files')

  const dest = process.cwd()

  try {
    await copyContent(CONTENT_DIR, dest, platform, ctx)
    success('Files copied to project root')
  } catch (err) {
    error(`Failed to copy content: ${err.message}`)
    process.exit(1)
  }
}

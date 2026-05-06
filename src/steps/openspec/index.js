import { execa } from 'execa'
import path from 'node:path'
import { error, header, success, warn } from '../../utils/exec.js'
import { APPLY_TARGETS, patchApplyFile } from './ensemble.js'

export async function initOpenspec() {
  header('Step 6, Initializing OpenSpec');

  try {
    const result = await execa('npx', ['@fission-ai/openspec', 'init', '--tools', 'opencode', '--force'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      reject: false,
    });

    if (result.exitCode === 0) success('OpenSpec initialized');
    else warn('OpenSpec init exited with non-zero code, check output above');
  } catch (err) {
    error(`Failed to run openspec init: ${err.message}`);
  }

  for (const rel of APPLY_TARGETS) {
    const abs = path.join(process.cwd(), rel);
    try {
      const res = await patchApplyFile(abs);
      if (res.ok) success(`Patched ensemble implementation section in ${rel}`);
      else warn(`Could not patch ${rel} (${res.reason})`);
    } catch (err) {
      warn(`Could not patch ${rel}: ${err.message}`);
    }
  }
}

import path from 'path'
import { header, info, success, warn } from '../../utils/exec.js'
import { fetchModels } from '../../utils/models-cache.js'
import { buildDisplayModels, modelsPreset, pickModel } from './format.js'
import { writeModelsToConfigs } from './write.js'

export async function chooseModels() {
  header('Step 7, Choose models');

  info('Fetching available models from models.dev...');
  const { models: rawModels, source } = await fetchModels();

  if (!rawModels) {
    warn('Could not fetch models (offline and no cache). Skipping model selection.');
    warn('Set models later in .agents/agents/<name>.md and .opencode/opencode.json');
    return;
  }

  if (source === 'stale-cache') {
    warn('Network unavailable, using cached model list (may be outdated).');
  } else if (source === 'cache') {
    info('Using cached model list (refreshes weekly).');
  }

  const models = buildDisplayModels(rawModels);
  success(`${models.length} models available`);
  console.log();
  info('Cost indicators: [$] cheap  [$$] mid  [$$$] expensive');
  info('Type to search. Change selections later in .agents/agents/ and .opencode/opencode.json');
  console.log();

  for (const line of modelsPreset.roles.plan.info) info(line);
  const planModel = await pickModel(modelsPreset.roles.plan.prompt, models);
  console.log();

  for (const line of modelsPreset.roles.build.info) info(line);
  const buildModel = await pickModel(modelsPreset.roles.build.prompt, models);
  console.log();

  for (const line of modelsPreset.roles.fast.info) info(line);
  const fastModel = await pickModel(modelsPreset.roles.fast.prompt, models);
  console.log();

  const agentsDir = path.join(process.cwd(), '.agents', 'agents');
  await writeModelsToConfigs({ planModel, buildModel, fastModel, agentsDir, preset: modelsPreset });

  console.log();
  warn('Make sure you have API access to the selected models.');
  warn('Change them anytime in .agents/agents/<name>.md and .opencode/opencode.json');

  return { planModel, buildModel, fastModel };
}

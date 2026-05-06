import fse from 'fs-extra'
import path from 'path'
import { success } from '../../utils/exec.js'

export async function writeModelToAgent(agentFile, modelId) {
  const content = await fse.readFile(agentFile, 'utf-8');
  const updated = content.replace(
    /^(---\n[\s\S]*?)\n---/m,
    `$1\nmodel: ${modelId}\n---`
  );
  await fse.writeFile(agentFile, updated, 'utf-8');
}

export async function writeModelsToConfigs({ planModel, buildModel, fastModel, agentsDir, preset }) {
  for (const name of preset.roles.build.agents) {
    const file = path.join(agentsDir, `${name}.md`);
    if (await fse.pathExists(file)) {
      await writeModelToAgent(file, buildModel);
      success(`${name} → ${buildModel}`);
    }
  }

  for (const name of preset.roles.fast.agents) {
    const file = path.join(agentsDir, `${name}.md`);
    if (await fse.pathExists(file)) {
      await writeModelToAgent(file, fastModel);
      success(`${name} → ${fastModel}`);
    }
  }

  const opencodeJsonPath = path.join(process.cwd(), '.opencode', 'opencode.json');
  if (await fse.pathExists(opencodeJsonPath)) {
    const config = await fse.readJson(opencodeJsonPath);
    config.model = buildModel;
    await fse.writeJson(opencodeJsonPath, config, { spaces: 2 });
    success(`default model -> ${buildModel} (written to .opencode/opencode.json)`);
  }

  const ensembleJsonPath = path.join(process.cwd(), '.opencode', 'ensemble.json');
  if (await fse.pathExists(ensembleJsonPath)) {
    const ensemble = await fse.readJson(ensembleJsonPath);
    delete ensemble.defaultModel;
    ensemble.modelsByAgent = {
      ...ensemble.modelsByAgent,
      plan: planModel,
      build: buildModel,
      explore: fastModel,
    };
    await fse.writeJson(ensembleJsonPath, ensemble, { spaces: 2 });
    success(`plan model -> ${planModel} (written to .opencode/ensemble.json)`);
    success(`build model -> ${buildModel} (written to .opencode/ensemble.json)`);
    success(`fast model -> ${fastModel} (written to .opencode/ensemble.json)`);
  }
}

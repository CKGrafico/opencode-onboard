import { search } from '@inquirer/prompts'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_PRESET_PATH = path.resolve(__dirname, '../../presets/models.json');
const modelsPreset = await fse.readJson(MODELS_PRESET_PATH);

function costTier(input) {
  if (input === undefined || input === null) return '';
  const tier = modelsPreset.costTiers.find(t => t.max === undefined || input <= t.max);
  return tier ? ` ${tier.label}` : '';
}

function costTierDisplay(cost, canonicalCost) {
  return costTier(canonicalCost !== undefined ? canonicalCost : cost);
}

function formatPrice(price) {
  if (price === undefined || price === null) return '?';
  if (price === 0) return '$0 (subscription)';
  return `$${price}/M`;
}

export function buildDisplayModels(rawModels) {
  return rawModels.map(m => {
    const priceStr = formatPrice(m.cost);
    const canonicalNote = m.canonicalCost !== undefined
      ? ` · official price: ${formatPrice(m.canonicalCost)}/M`
      : '';
    return {
      ...m,
      label: `${m.name}${costTierDisplay(m.cost, m.canonicalCost)}, ${m.id}`,
      description: `${priceStr}${canonicalNote} · context: ${m.context ? (m.context / 1000) + 'k' : '?'}`,
    };
  });
}

export async function pickModel(message, models) {
  return await search({
    message,
    source: (input) => {
      const q = (input || '').toLowerCase();
      const filtered = q
        ? models.filter(m =>
            m.label.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
          )
        : models;
      return filtered.slice(0, 50).map(m => ({
        name: m.label,
        value: m.id,
        description: m.description,
      }));
    },
  });
}

export { modelsPreset };

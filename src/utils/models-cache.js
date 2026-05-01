import fse from 'fs-extra'
import os from 'os'
import path from 'path'

const CACHE_DIR = path.join(os.homedir(), '.config', 'opencode-onboard')
const CACHE_FILE = path.join(CACHE_DIR, 'models-cache.json')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MODELS_URL = 'https://models.dev/api.json'

// Providers considered "canonical" for reference pricing, in priority order.
// When a model's own provider has no cost (e.g. github-copilot shows $0),
// we look up the same model name in these providers and attach canonicalCost.
const CANONICAL_PROVIDERS = ['anthropic', 'openai', 'google', 'mistral', 'meta', 'cohere']

function parseModels(data) {
  // Build name → canonical cost lookup from authoritative providers first
  // name is the human-readable model name, e.g. "Claude Opus 4.6"
  const canonicalCostByName = new Map()
  for (const providerId of CANONICAL_PROVIDERS) {
    const provider = data[providerId]
    if (!provider?.models) continue
    for (const model of Object.values(provider.models)) {
      if (!model.tool_call) continue
      const name = model.name
      if (name && model.cost?.input !== undefined && !canonicalCostByName.has(name)) {
        canonicalCostByName.set(name, model.cost.input)
      }
    }
  }

  const models = []
  for (const [providerId, provider] of Object.entries(data)) {
    if (!provider.models) continue
    for (const [modelId, model] of Object.entries(provider.models)) {
      if (!model.tool_call) continue
      const name = model.name || modelId
      const cost = model.cost?.input
      const canonicalCost = canonicalCostByName.get(name)
      models.push({
        id: `${providerId}/${modelId}`,
        name,
        cost,
        // canonicalCost: cost from the authoritative provider for this model name.
        // Defined when cost !== canonicalCost (different provider, reseller, or $0 subscription).
        canonicalCost: canonicalCost !== undefined && canonicalCost !== cost ? canonicalCost : undefined,
        context: model.limit?.context,
      })
    }
  }
  models.sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity))
  return models
}

async function loadCache() {
  try {
    if (!await fse.pathExists(CACHE_FILE)) return null
    const cache = await fse.readJson(CACHE_FILE)
    if (!cache.timestamp || !cache.models) return null
    const age = Date.now() - cache.timestamp
    if (age > CACHE_TTL_MS) return null // expired
    return cache.models
  } catch {
    return null
  }
}

async function saveCache(models) {
  try {
    await fse.ensureDir(CACHE_DIR)
    await fse.writeJson(CACHE_FILE, { timestamp: Date.now(), models })
  } catch {
    // cache write failure is non-fatal
  }
}

export async function fetchModels() {
  // 1. Try cache first (fresh)
  const cached = await loadCache()
  if (cached) return { models: cached, source: 'cache' }

  // 2. Try network
  try {
    const res = await fetch(MODELS_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const models = parseModels(data)
    await saveCache(models)
    return { models, source: 'network' }
  } catch {
    // 3. Network failed, fall back to stale cache if available
    try {
      if (await fse.pathExists(CACHE_FILE)) {
        const cache = await fse.readJson(CACHE_FILE)
        if (cache.models?.length) return { models: cache.models, source: 'stale-cache' }
      }
    } catch {
      // ignore
    }
    return { models: null, source: 'unavailable' }
  }
}

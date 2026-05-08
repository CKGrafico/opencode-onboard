import { describe, it, expect } from 'vitest'
import { buildDisplayModels } from './format.js'

describe('buildDisplayModels()', () => {
  it('adds cost tier label for cheap models', () => {
    const raw = [{ id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', cost: 3, context: 200000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].label).toContain('[$$]')
  })

  it('adds cost tier label for mid-range models', () => {
    const raw = [{ id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', cost: 15, context: 200000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].label).toContain('[$$$]')
  })

  it('adds cost tier label for expensive models', () => {
    const raw = [{ id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', cost: 30, context: 128000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].label).toContain('[$$$]')
  })

  it('shows canonical cost note when provider cost differs', () => {
    const raw = [{ id: 'github-copilot/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', cost: 0, canonicalCost: 3, context: 200000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].description).toContain('official price: $3/M')
  })

  it('formats context in thousands', () => {
    const raw = [{ id: 'test/model', name: 'Test', cost: 1, context: 128000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].description).toContain('context: 128k')
  })

  it('handles missing cost as ?', () => {
    const raw = [{ id: 'test/model', name: 'Test', context: 1000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].description).toContain('?')
    expect(result[0].label).not.toContain('[')
  })

  it('handles $0 subscription pricing', () => {
    const raw = [{ id: 'test/model', name: 'Test', cost: 0, context: 1000 }]

    const result = buildDisplayModels(raw)

    expect(result[0].description).toContain('$0 (subscription)')
  })

  it('preserves input order (sorting is done upstream by parseModels)', () => {
    const raw = [
      { id: 'expensive/model', name: 'Expensive', cost: 100, context: 1000 },
      { id: 'cheap/model', name: 'Cheap', cost: 1, context: 1000 },
      { id: 'mid/model', name: 'Mid', cost: 10, context: 1000 },
    ]

    const result = buildDisplayModels(raw)

    expect(result[0].id).toBe('expensive/model')
    expect(result[1].id).toBe('cheap/model')
    expect(result[2].id).toBe('mid/model')
  })
})
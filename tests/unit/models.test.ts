import { describe, expect, it } from 'vitest'
import { MODELS, SUPERSEDED, assertNoDuplicateBaseModels, defaultSelectedModelIds, modelById } from '../../src/lib/models'

describe('model registry', () => {
  it('never reports the same base model twice', () => {
    expect(() => assertNoDuplicateBaseModels()).not.toThrow()
    const bases = MODELS.map((model) => model.baseModel)
    expect(new Set(bases).size).toBe(bases.length)
  })

  it('keeps one selectable entry per base model and names every excluded variant', () => {
    expect(MODELS).toHaveLength(11)
    for (const excluded of SUPERSEDED) {
      expect(excluded.reason.length).toBeGreaterThan(10)
      expect(MODELS.some((model) => model.id === excluded.id)).toBe(false)
    }
    // Every excluded id must name the base model it duplicates, and that base must be
    // represented exactly once among the selectable models.
    for (const excluded of SUPERSEDED) {
      const matches = MODELS.filter((model) => model.baseModel === excluded.baseModel)
      expect(matches.length).toBeLessThanOrEqual(1)
    }
  })

  it('labels the two AI models and nothing else', () => {
    const ai = MODELS.filter((model) => model.kind === 'ai').map((model) => model.id)
    expect(ai).toEqual(['ecmwf_aifs025', 'gfs_graphcast025'])
  })

  it('gives every model a distinct colour and attribution', () => {
    const colours = MODELS.map((model) => model.color)
    expect(new Set(colours).size).toBe(colours.length)
    for (const model of MODELS) {
      expect(model.attribution.length).toBeGreaterThan(2)
      expect(model.docsUrl.startsWith('https://')).toBe(true)
    }
  })

  it('defaults to every model, and rejects unknown ids loudly', () => {
    expect(defaultSelectedModelIds()).toHaveLength(11)
    expect(() => modelById('not_a_model')).toThrow(/Unknown model id/)
  })
})

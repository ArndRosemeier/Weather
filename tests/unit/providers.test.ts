import { describe, expect, it } from 'vitest'
import { MODELS } from '../../src/lib/models'
import { PROVIDERS, modelsForProvider, providerFor } from '../../src/lib/providers'

describe('provider registry', () => {
  it('resolves the provider behind every selectable model', () => {
    for (const model of MODELS) {
      expect(() => providerFor(model.providerId), model.id).not.toThrow()
      expect(providerFor(model.providerId).name).toBe(model.provider)
    }
  })

  it('gives every provider a substantial, linkable description', () => {
    for (const provider of Object.values(PROVIDERS)) {
      expect(provider.fullName.length, provider.id).toBeGreaterThan(3)
      expect(provider.where.length, provider.id).toBeGreaterThan(5)
      expect(provider.description.length, provider.id).toBeGreaterThan(60)
      expect(provider.url.startsWith('https://') || provider.url.startsWith('http://'), provider.id).toBe(true)
    }
  })

  it('lists the models contributed by a provider, including the shared ECMWF entry', () => {
    expect(modelsForProvider('ecmwf').map((model) => model.id)).toEqual(['ecmwf_ifs', 'ecmwf_aifs025'])
    expect(modelsForProvider('dwd')).toHaveLength(1)
    expect(modelsForProvider('not_a_provider')).toEqual([])
  })

  it('fails loudly on an unknown provider id', () => {
    expect(() => providerFor('nope')).toThrow(/Unknown provider id/)
  })
})

import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings } from '../../src/lib/settings'

describe('settings boundary', () => {
  it('accepts the offered forecast lengths and drops withdrawn ones', () => {
    expect(sanitizeSettings({ days: 7 }).days).toBe(7)
    expect(sanitizeSettings({ days: 10 }).days).toBe(10)
    expect(sanitizeSettings({ days: 16 }).days).toBe(16)
    expect(sanitizeSettings({ days: 3 }).days).toBe(DEFAULT_SETTINGS.days)
    expect(sanitizeSettings({ days: 99 }).days).toBe(DEFAULT_SETTINGS.days)
  })

  it('drops unknown model ids but keeps a selection', () => {
    expect(sanitizeSettings({ modelIds: ['ecmwf_ifs', 'nope'] }).modelIds).toEqual(['ecmwf_ifs'])
    expect(sanitizeSettings({ modelIds: [] }).modelIds).toEqual(DEFAULT_SETTINGS.modelIds)
  })
})

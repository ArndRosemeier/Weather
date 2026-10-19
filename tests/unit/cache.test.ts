import { beforeEach, describe, expect, it } from 'vitest'
import { CACHE_TTL_MS, isFresh, readCache, writeCache } from '../../src/lib/cache'
import type { ForecastBundle } from '../../src/lib/types'

class MemoryStorage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

function bundle(): ForecastBundle {
  return {
    location: { name: 'Berlin', latitude: 52.5244, longitude: 13.4105 },
    timezone: 'Europe/Berlin',
    utcOffsetSeconds: 7200,
    fetchedAt: Date.now(),
    hourlyTimes: Array.from({ length: 168 }, (_, i) => `2026-01-01T${String(i % 24).padStart(2, '0')}:00`),
    dailyDates: ['2026-01-01'],
    models: [],
  }
}

beforeEach(() => {
  ;(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: new MemoryStorage() }
})

describe('forecast cache', () => {
  it('round-trips a bundle and reports freshness', () => {
    writeCache(bundle(), 7)
    const hit = readCache(52.5244, 13.4105, 7)
    expect(hit?.bundle.timezone).toBe('Europe/Berlin')
    expect(isFresh(hit!.savedAt)).toBe(true)
    expect(isFresh(Date.now() - CACHE_TTL_MS - 1)).toBe(false)
  })

  it('returns null for a miss and never throws on corrupt entries', () => {
    expect(readCache(1, 2, 7)).toBeNull()
    window.localStorage.setItem('weather-compare:v1:forecast:1.000:2.000:7', '{oops')
    expect(readCache(1, 2, 7)).toBeNull()
  })

  it('survives a storage that throws (private mode)', () => {
    ;(globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: {
        getItem() { throw new Error('denied') },
        setItem() { throw new Error('denied') },
        removeItem() { throw new Error('denied') },
        clear() { throw new Error('denied') },
        key() { throw new Error('denied') },
        length: 0,
      } as unknown as Storage,
    }
    expect(() => writeCache(bundle(), 7)).not.toThrow()
    expect(readCache(52.5, 13.4, 7)).toBeNull()
  })
})

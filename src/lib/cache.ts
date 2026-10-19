import type { ForecastBundle } from './types'

const PREFIX = 'weather-compare:v1:forecast'
export const CACHE_TTL_MS = 20 * 60 * 1000

export interface CachedForecast {
  savedAt: number
  bundle: ForecastBundle
}

function storage(): Storage | null {
  try {
    const probe = '__wx_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

export function cacheKey(latitude: number, longitude: number, days: number): string {
  return `${PREFIX}:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${days}`
}

export function readCache(latitude: number, longitude: number, days: number): CachedForecast | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(cacheKey(latitude, longitude, days))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedForecast
    if (typeof parsed.savedAt !== 'number' || !parsed.bundle || !Array.isArray(parsed.bundle.models)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeCache(cached: CachedForecast): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(cacheKey(cached.bundle.location.latitude, cached.bundle.location.longitude, cached.bundle.hourlyTimes.length / 24), JSON.stringify(cached))
  } catch {
    /* Quota or private mode: caching is optional enrichment, never a failure. */
  }
}

export function isFresh(savedAt: number, now = Date.now()): boolean {
  return now - savedAt < CACHE_TTL_MS
}

export function clearCache(): void {
  const store = storage()
  if (!store) return
  for (const key of Object.keys(store)) {
    if (key.startsWith(PREFIX)) store.removeItem(key)
  }
}

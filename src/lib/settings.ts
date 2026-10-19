import { MODELS, findModel } from './models'
import { PRESET_LOCATIONS } from './geocode'
import type { UnitSystem, WeatherLocation } from './types'

const KEY = 'weather-compare:v1:settings'
export const DAY_OPTIONS = [7, 10, 16] as const
export type DayCount = (typeof DAY_OPTIONS)[number]

export interface Settings {
  location: WeatherLocation
  modelIds: string[]
  system: UnitSystem
  days: DayCount
  recent: WeatherLocation[]
}

export const DEFAULT_SETTINGS: Settings = {
  location: PRESET_LOCATIONS[0] as WeatherLocation,
  modelIds: MODELS.map((model) => model.id),
  system: 'metric',
  days: 7,
  recent: [],
}

function isLocation(value: unknown): value is WeatherLocation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WeatherLocation>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  )
}

function isDayCount(value: unknown): value is DayCount {
  return typeof value === 'number' && (DAY_OPTIONS as readonly number[]).includes(value)
}

/** Validate persisted preferences at the boundary. Unknown or corrupt values are
 *  dropped — a preference is a genuine default, never a mask for a data failure. */
export function sanitizeSettings(value: unknown): Settings {
  const candidate = (value ?? {}) as Partial<Settings>
  const modelIds = Array.isArray(candidate.modelIds)
    ? candidate.modelIds.filter((id): id is string => typeof id === 'string' && Boolean(findModel(id)))
    : []
  const recent = Array.isArray(candidate.recent) ? candidate.recent.filter(isLocation).slice(0, 4) : []
  return {
    location: isLocation(candidate.location) ? candidate.location : DEFAULT_SETTINGS.location,
    modelIds: modelIds.length > 0 ? modelIds : DEFAULT_SETTINGS.modelIds,
    system: candidate.system === 'imperial' ? 'imperial' : 'metric',
    days: isDayCount(candidate.days) ? candidate.days : DEFAULT_SETTINGS.days,
    recent,
  }
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* Private mode: preferences simply do not persist. */
  }
}

export function pushRecent(settings: Settings, location: WeatherLocation): WeatherLocation[] {
  const deduped = settings.recent.filter(
    (entry) => Math.abs(entry.latitude - location.latitude) > 0.01 || Math.abs(entry.longitude - location.longitude) > 0.01,
  )
  return [location, ...deduped].slice(0, 4)
}

export function sameLocation(a: WeatherLocation, b: WeatherLocation): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.001 && Math.abs(a.longitude - b.longitude) < 0.001
}

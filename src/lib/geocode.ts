import { GEOCODING_ENDPOINT } from './api'
import type { WeatherLocation } from './types'

export interface GeoResult extends WeatherLocation {
  id: number
}

export const PRESET_LOCATIONS: WeatherLocation[] = [
  { name: 'Berlin', country: 'Germany', latitude: 52.5244, longitude: 13.4105, timezone: 'Europe/Berlin' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'New York', country: 'United States', latitude: 40.7143, longitude: -74.006, timezone: 'America/New_York' },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { name: 'Sydney', country: 'Australia', latitude: -33.8679, longitude: 151.2073, timezone: 'Australia/Sydney' },
]

interface RawGeoResponse {
  results?: {
    id: number
    name: string
    country?: string
    admin1?: string
    latitude: number
    longitude: number
    timezone?: string
  }[]
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const params = new URLSearchParams({ name: trimmed, count: '8', language: 'en', format: 'json' })
  const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Location search failed (${response.status}).`)
  const body = (await response.json()) as RawGeoResponse
  if (!Array.isArray(body.results)) return []
  return body.results
    .filter((entry) => typeof entry.latitude === 'number' && typeof entry.longitude === 'number')
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      country: entry.country,
      admin1: entry.admin1,
      latitude: entry.latitude,
      longitude: entry.longitude,
      timezone: entry.timezone,
    }))
}

export function locationLabel(location: WeatherLocation): string {
  return [location.name, location.country].filter(Boolean).join(', ')
}

export function withLocalTimeZone(location: WeatherLocation, timezone: string): WeatherLocation {
  return { ...location, timezone }
}

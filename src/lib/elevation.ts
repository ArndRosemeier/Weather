import type { ForecastBundle, WeatherLocation } from './types'

/** Above this, a point is high ground rather than a coastal town. The warning is
 *  about interpretation, not about the forecast being wrong for that point. */
export const HIGH_POINT_METERS = 500

export function elevationOf(location: WeatherLocation, bundle: ForecastBundle | null): number | null {
  if (typeof location.elevation === 'number') return location.elevation
  return bundle?.elevation ?? null
}

export function isHighPoint(elevation: number | null): boolean {
  return elevation !== null && elevation >= HIGH_POINT_METERS
}

export function formatElevation(elevation: number): string {
  return `${Math.round(elevation).toLocaleString('en-GB')} m`
}

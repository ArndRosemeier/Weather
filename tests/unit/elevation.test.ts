import { describe, expect, it } from 'vitest'
import { HIGH_POINT_METERS, elevationOf, formatElevation, isHighPoint } from '../../src/lib/elevation'
import type { ForecastBundle, WeatherLocation } from '../../src/lib/types'

const bundle = (elevation: number | null): ForecastBundle => ({
  location: { name: 'x', latitude: 0, longitude: 0 },
  timezone: 'UTC',
  elevation,
  utcOffsetSeconds: 0,
  fetchedAt: 0,
  hourlyTimes: [],
  dailyDates: [],
  models: [],
})

describe('elevation', () => {
  it('prefers the selected place elevation over the forecast response', () => {
    const location: WeatherLocation = { name: 'Gran Canaria', latitude: 27.97, longitude: -15.58, elevation: 1682 }
    expect(elevationOf(location, bundle(74))).toBe(1682)
    expect(elevationOf({ name: 'x', latitude: 0, longitude: 0 }, bundle(1682))).toBe(1682)
    expect(elevationOf({ name: 'x', latitude: 0, longitude: 0 }, null)).toBeNull()
  })

  it('treats 500 m as the boundary for a high point and formats metres', () => {
    expect(isHighPoint(HIGH_POINT_METERS - 1)).toBe(false)
    expect(isHighPoint(HIGH_POINT_METERS)).toBe(true)
    expect(isHighPoint(null)).toBe(false)
    expect(formatElevation(1682)).toBe('1,682 m')
    expect(formatElevation(30)).toBe('30 m')
  })
})

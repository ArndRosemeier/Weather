import { describe, expect, it } from 'vitest'
import { aggregateDaily, aggregateHourly, consensusWeatherCode, contributingModels } from '../../src/lib/average'
import type { ModelForecast } from '../../src/lib/types'
import { modelById } from '../../src/lib/models'

function model(id: string, temps: (number | null)[], codes: (number | null)[] = [], horizon = temps.length): ModelForecast {
  return {
    model: modelById(id),
    status: horizon === 0 ? 'unavailable' : 'ok',
    horizonHours: horizon,
    hourly: temps.map((temperature, index) => ({
      time: `2026-01-0${Math.floor(index / 24) + 1}T${String(index % 24).padStart(2, '0')}:00`,
      temperature,
      apparentTemperature: temperature,
      precipitation: temperature === null ? null : 0,
      precipitationProbability: null,
      weatherCode: codes[index] ?? null,
      cloudCover: null,
      windSpeed: 10,
      humidity: 60,
    })),
    daily: [],
  }
}

describe('null-aware averaging', () => {
  it('averages only the models that have data at that hour', () => {
    const a = model('ecmwf_ifs', [10, 12])
    const b = model('gfs_global', [14, null])
    const c = model('icon_global', [null, null], [], 0)
    const points = aggregateHourly([a, b, c], 2)
    expect(points[0]?.temperature).toBe(12)
    expect(points[0]?.contributing).toBe(2)
    expect(points[1]?.temperature).toBe(12)
    expect(points[1]?.contributing).toBe(1)
  })

  it('returns null instead of zero when no model has data', () => {
    const points = aggregateHourly([model('ecmwf_ifs', [null]), model('gfs_global', [null])], 1)
    expect(points[0]?.temperature).toBeNull()
    expect(points[0]?.precipitation).toBeNull()
    expect(points[0]?.contributing).toBe(0)
  })

  it('reports the per-hour min and max band', () => {
    const points = aggregateHourly([model('ecmwf_ifs', [5]), model('gfs_global', [9])], 1)
    expect(points[0]?.min).toBe(5)
    expect(points[0]?.max).toBe(9)
  })

  it('picks the modal weather code and breaks ties toward the mean temperature', () => {
    const models = [model('ecmwf_ifs', [10], [61]), model('gfs_global', [12], [61]), model('icon_global', [30], [3])]
    expect(consensusWeatherCode(models, 0, 17)).toBe(61)
    const split = [model('ecmwf_ifs', [10], [61]), model('gfs_global', [20], [3])]
    expect(consensusWeatherCode(split, 0, 11)).toBe(61)
  })

  it('marks an all-null model as unavailable and excludes it from contributors', () => {
    const ok = model('ecmwf_ifs', [10])
    const down = model('gfs_global', [null], [], 0)
    expect(down.status).toBe('unavailable')
    expect(contributingModels([ok, down]).map((m) => m.model.id)).toEqual(['ecmwf_ifs'])
  })

  it('aggregates daily values from each model rather than from the average curve', () => {
    const a: ModelForecast = { ...model('ecmwf_ifs', []), daily: [{ date: '2026-01-01', tempMax: 10, tempMin: 2, precipitationSum: 0, weatherCode: 3, windMax: 20, sunrise: null, sunset: null }] }
    const b: ModelForecast = { ...model('gfs_global', []), daily: [{ date: '2026-01-01', tempMax: 14, tempMin: 4, precipitationSum: 2, weatherCode: 61, windMax: 30, sunrise: null, sunset: null }] }
    const days = aggregateDaily([a, b], 1)
    expect(days[0]?.tempMax).toBe(12)
    expect(days[0]?.tempMin).toBe(3)
    expect(days[0]?.min).toBe(2)
    expect(days[0]?.max).toBe(14)
    expect(days[0]?.contributing).toBe(2)
  })

  it('refuses to aggregate nothing', () => {
    expect(() => aggregateHourly([], 1)).toThrow(/at least one model/)
  })
})

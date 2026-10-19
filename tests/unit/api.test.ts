import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MODELS } from '../../src/lib/models'
import { buildForecastUrl, parseForecast, WeatherApiError } from '../../src/lib/api'
import type { WeatherLocation } from '../../src/lib/types'

const fixture = JSON.parse(fs.readFileSync('tests/fixtures/berlin-7d.json', 'utf8'))
const ids = MODELS.map((model) => model.id)
const berlin: WeatherLocation = { name: 'Berlin', country: 'Germany', latitude: 52.5244, longitude: 13.4105 }

describe('forecast client', () => {
  it('asks for every model, the full variable set and the location timezone', () => {
    const url = new URL(buildForecastUrl({ latitude: 52.5244, longitude: 13.4105, modelIds: ids, days: 7 }))
    expect(url.searchParams.get('models')).toBe(ids.join(','))
    expect(url.searchParams.get('timezone')).toBe('auto')
    expect(url.searchParams.get('forecast_days')).toBe('7')
    expect(url.searchParams.get('hourly')).toContain('temperature_2m')
    expect(url.searchParams.get('daily')).toContain('sunrise')
  })

  it('refuses to build a request with no models', () => {
    expect(() => buildForecastUrl({ latitude: 0, longitude: 0, modelIds: [], days: 7 })).toThrow(WeatherApiError)
  })

  it('parses all requested models and preserves the genuine nulls', () => {
    const bundle = parseForecast(fixture, berlin, ids) as ReturnType<typeof parseForecast>
    expect(bundle.models).toHaveLength(ids.length)
    expect(bundle.timezone).toBe('Europe/Berlin')
    expect(bundle.utcOffsetSeconds).toBe(7200)
    const arpege = bundle.models.find((model) => model.model.id === 'meteofrance_arpege_world')
    expect(arpege?.horizonHours).toBe(111)
    expect(arpege?.hourly[111]?.temperature).toBeNull()
    expect(arpege?.hourly[110]?.temperature).not.toBeNull()
    const icon = bundle.models.find((model) => model.model.id === 'icon_global')
    expect(icon?.status).toBe('ok')
  })

  it('marks a model with no values as unavailable rather than failing the whole request', () => {
    const bundle = parseForecast(fixture, berlin, ids)
    for (const id of ['ecmwf_aifs025', 'gfs_graphcast025', 'bom_access_global']) {
      const model = bundle.models.find((entry) => entry.model.id === id)
      expect(model?.status).toBe('unavailable')
      expect(model?.horizonHours).toBe(0)
    }
  })

  it('reads unsuffixed series from a single-model response', () => {
    const single = {
      timezone: 'UTC',
      utc_offset_seconds: 0,
      hourly: { time: ['2026-01-01T00:00', '2026-01-01T01:00'], temperature_2m: [1, 2], precipitation: [0, 0.4] },
      daily: { time: ['2026-01-01'], temperature_2m_max: [4], temperature_2m_min: [0], sunrise: ['2026-01-01T08:00'], sunset: ['2026-01-01T16:00'] },
    }
    const bundle = parseForecast(single, berlin, ['ecmwf_ifs'])
    expect(bundle.models[0]?.hourly[1]?.temperature).toBe(2)
    expect(bundle.models[0]?.daily[0]?.tempMax).toBe(4)
    expect(bundle.models[0]?.daily[0]?.sunrise).toBe('2026-01-01T08:00')
  })

  it('throws loudly on an API error or a malformed payload', () => {
    expect(() => parseForecast({ error: true, reason: 'Invalid latitude' }, berlin, ids)).toThrow(/Invalid latitude/)
    expect(() => parseForecast({ hourly: {} }, berlin, ids)).toThrow(/hourly data/)
    expect(() => parseForecast(null, berlin, ids)).toThrow(/not JSON/)
  })
})

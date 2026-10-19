import type { DailyPoint, ForecastBundle, HourlyPoint, ModelForecast, WeatherLocation } from './types'
import { modelById } from './models'

export const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
export const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'

export const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'relative_humidity_2m',
] as const

export const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'weather_code',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
] as const

export interface ForecastRequest {
  latitude: number
  longitude: number
  modelIds: string[]
  days: number
}

export class WeatherApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'WeatherApiError'
  }
}

export function buildForecastUrl(request: ForecastRequest): string {
  if (request.modelIds.length === 0) throw new WeatherApiError('Select at least one model.')
  const params = new URLSearchParams({
    latitude: request.latitude.toFixed(4),
    longitude: request.longitude.toFixed(4),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    forecast_days: String(request.days),
    timezone: 'auto',
    models: request.modelIds.join(','),
  })
  return `${FORECAST_ENDPOINT}?${params.toString()}`
}

type RawSeries = Record<string, unknown>

export interface RawForecast {
  error?: boolean
  reason?: string
  timezone?: string
  utc_offset_seconds?: number
  hourly?: RawSeries
  daily?: RawSeries
}

function numericSeries(hourly: RawSeries, key: string): (number | null)[] {
  const value = hourly[key]
  if (!Array.isArray(value)) return []
  return value.map((entry) => (typeof entry === 'number' && Number.isFinite(entry) ? entry : null))
}

function textSeries(hourly: RawSeries, key: string): (string | null)[] {
  const value = hourly[key]
  if (!Array.isArray(value)) return []
  return value.map((entry) => (typeof entry === 'string' ? entry : null))
}

/** Validate the API response at the boundary. Anything structurally wrong throws —
 *  it never becomes empty data. A model that is present but has no values is a
 *  legitimate, visible "unavailable" state, not an error. */
export function parseForecast(raw: unknown, location: WeatherLocation, modelIds: string[], fetchedAt = Date.now()): ForecastBundle {
  if (!raw || typeof raw !== 'object') throw new WeatherApiError('The forecast response was not JSON.')
  const body = raw as RawForecast
  if (body.error) throw new WeatherApiError(body.reason ?? 'The forecast service returned an error.')
  const hourly = body.hourly
  const daily = body.daily
  if (!hourly || !Array.isArray(hourly.time)) throw new WeatherApiError('The forecast response is missing hourly data.')
  if (!daily || !Array.isArray(daily.time)) throw new WeatherApiError('The forecast response is missing daily data.')

  const hourlyTimes = hourly.time.filter((t): t is string => typeof t === 'string')
  const dailyDates = daily.time.filter((t): t is string => typeof t === 'string')
  if (hourlyTimes.length === 0) throw new WeatherApiError('The forecast response contained no hours.')

  const models: ModelForecast[] = modelIds.map((id) => {
    const info = modelById(id)
    const suffix = `_${id}`
    const single = modelIds.length === 1
    const series = (name: string) => (single ? numericSeries(hourly, name) : numericSeries(hourly, `${name}${suffix}`))
    const dailyNum = (name: string) => (single ? numericSeries(daily, name) : numericSeries(daily, `${name}${suffix}`))
    const dailyText = (name: string) => (single ? textSeries(daily, name) : textSeries(daily, `${name}${suffix}`))

    const temperature = series('temperature_2m')
    const precipitation = series('precipitation')
    const weatherCode = series('weather_code')
    const windSpeed = series('wind_speed_10m')

    const apparent = series('apparent_temperature')
    const probability = series('precipitation_probability')
    const cloud = series('cloud_cover')
    const humidity = series('relative_humidity_2m')

    const hourlyPoints: HourlyPoint[] = hourlyTimes.map((time, index) => ({
      time,
      temperature: temperature[index] ?? null,
      apparentTemperature: apparent[index] ?? null,
      precipitation: precipitation[index] ?? null,
      precipitationProbability: probability[index] ?? null,
      weatherCode: weatherCode[index] ?? null,
      cloudCover: cloud[index] ?? null,
      windSpeed: windSpeed[index] ?? null,
      humidity: humidity[index] ?? null,
    }))

    const source = hourlyPoints.some((p) => p.temperature !== null || p.precipitation !== null || p.windSpeed !== null)
      ? 'ok'
      : 'unavailable'
    const lastIndex = hourlyPoints.reduce((last, point, index) => {
      const hasData = point.temperature !== null || point.precipitation !== null || point.windSpeed !== null
      return hasData ? index : last
    }, -1)

    const sunrise = dailyText('sunrise')
    const sunset = dailyText('sunset')
    const dailyPoints: DailyPoint[] = dailyDates.map((date, index) => ({
      date,
      tempMax: dailyNum('temperature_2m_max')[index] ?? null,
      tempMin: dailyNum('temperature_2m_min')[index] ?? null,
      precipitationSum: dailyNum('precipitation_sum')[index] ?? null,
      weatherCode: dailyNum('weather_code')[index] ?? null,
      windMax: dailyNum('wind_speed_10m_max')[index] ?? null,
      sunrise: sunrise[index] ?? null,
      sunset: sunset[index] ?? null,
    }))

    return {
      model: info,
      status: source,
      hourly: hourlyPoints,
      daily: dailyPoints,
      horizonHours: lastIndex + 1,
    }
  })

  return {
    location,
    timezone: body.timezone ?? location.timezone ?? 'UTC',
    utcOffsetSeconds: body.utc_offset_seconds ?? 0,
    fetchedAt,
    hourlyTimes,
    dailyDates,
    models,
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fetch with bounded retries on transport/5xx failures. A 4xx is a caller bug and
 *  is surfaced immediately. */
export async function fetchForecast(request: ForecastRequest, options: { signal?: AbortSignal; attempts?: number } = {}): Promise<ForecastBundle> {
  const attempts = options.attempts ?? 2
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(buildForecastUrl(request), { signal: options.signal, headers: { Accept: 'application/json' } })
      if (!response.ok) {
        const body = await response.text()
        const error = new WeatherApiError(`Forecast request failed (${response.status}). ${body.slice(0, 200)}`, response.status)
        if (response.status < 500) throw error
        lastError = error
      } else {
        return parseForecast(await response.json(), {
          name: '',
          latitude: request.latitude,
          longitude: request.longitude,
        }, request.modelIds)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      lastError = error
      if (error instanceof WeatherApiError && error.status !== undefined && error.status < 500) throw error
    }
    if (attempt < attempts) await sleep(600 * attempt)
  }
  throw lastError instanceof Error ? lastError : new WeatherApiError('The forecast could not be loaded.')
}

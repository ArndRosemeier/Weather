export type UnitSystem = 'metric' | 'imperial'
export type ModelKind = 'physics' | 'ai'
export type ModelStatus = 'ok' | 'unavailable'

/** One selectable forecast model. `baseModel` is the dedupe key: two providers
 *  re-reporting the same underlying model share it and only one may be selectable. */
export interface ModelInfo {
  id: string
  name: string
  shortName: string
  provider: string
  baseModel: string
  kind: ModelKind
  color: string
  attribution: string
  docsUrl: string
}

/** A model deliberately NOT selectable, with the reason. Rendered in the UI and
 *  asserted by tests: every exclusion names the base model it duplicates or its
 *  coverage gap. */
export interface SupersededModel {
  id: string
  baseModel: string
  reason: string
}

export interface HourlyPoint {
  time: string
  temperature: number | null
  apparentTemperature: number | null
  precipitation: number | null
  precipitationProbability: number | null
  weatherCode: number | null
  cloudCover: number | null
  windSpeed: number | null
  humidity: number | null
}

export interface DailyPoint {
  date: string
  tempMax: number | null
  tempMin: number | null
  precipitationSum: number | null
  weatherCode: number | null
  windMax: number | null
  sunrise: string | null
  sunset: string | null
}

export interface ModelForecast {
  model: ModelInfo
  status: ModelStatus
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  /** hours of genuinely available data, measured from the response */
  horizonHours: number
}

export interface WeatherLocation {
  name: string
  country?: string
  admin1?: string
  latitude: number
  longitude: number
  timezone?: string
}

export interface ForecastBundle {
  location: WeatherLocation
  timezone: string
  utcOffsetSeconds: number
  fetchedAt: number
  hourlyTimes: string[]
  dailyDates: string[]
  models: ModelForecast[]
}

/** Per-timestep aggregation across the selected models. Null means no model had
 *  data for that step; it is never silently replaced with zero. */
export interface AggregatePoint {
  time: string
  temperature: number | null
  apparentTemperature: number | null
  precipitation: number | null
  precipitationProbability: number | null
  weatherCode: number | null
  windSpeed: number | null
  humidity: number | null
  min: number | null
  max: number | null
  contributing: number
}

export interface AggregateDailyPoint {
  date: string
  tempMax: number | null
  tempMin: number | null
  precipitationSum: number | null
  weatherCode: number | null
  windMax: number | null
  min: number | null
  max: number | null
  contributing: number
}

export interface UnitPrefs {
  system: UnitSystem
}

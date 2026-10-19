import type { AggregateDailyPoint, AggregatePoint, ModelForecast } from './types'

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function numbersAt(models: ModelForecast[], read: (model: ModelForecast) => number | null): number[] {
  const values: number[] = []
  for (const model of models) {
    const value = read(model)
    if (value !== null && Number.isFinite(value)) values.push(value)
  }
  return values
}

/** Mode of the weather codes, tie-broken by the code from the model whose
 *  temperature is closest to the ensemble mean (falling back to the smallest code).
 *  Deterministic on purpose: the same inputs always produce the same symbol. */
export function consensusWeatherCode(models: ModelForecast[], index: number, meanTemp: number | null): number | null {
  const entries: { code: number; distance: number }[] = []
  for (const model of models) {
    const code = model.hourly[index]?.weatherCode ?? null
    if (code === null) continue
    const temp = model.hourly[index]?.temperature ?? null
    const distance = meanTemp === null || temp === null ? Number.POSITIVE_INFINITY : Math.abs(temp - meanTemp)
    entries.push({ code, distance })
  }
  if (entries.length === 0) return null
  const counts = new Map<number, number>()
  for (const entry of entries) counts.set(entry.code, (counts.get(entry.code) ?? 0) + 1)
  const bestCount = Math.max(...counts.values())
  const tied = entries.filter((entry) => counts.get(entry.code) === bestCount)
  tied.sort((a, b) => a.distance - b.distance || a.code - b.code)
  return tied[0]?.code ?? null
}

export function aggregateHourly(models: ModelForecast[], hourCount: number): AggregatePoint[] {
  if (models.length === 0) throw new Error('aggregateHourly needs at least one model')
  const points: AggregatePoint[] = []
  for (let index = 0; index < hourCount; index += 1) {
    const time = models[0]?.hourly[index]?.time ?? ''
    const temps = numbersAt(models, (m) => m.hourly[index]?.temperature ?? null)
    const meanTemp = mean(temps)
    points.push({
      time,
      temperature: meanTemp,
      apparentTemperature: mean(numbersAt(models, (m) => m.hourly[index]?.apparentTemperature ?? null)),
      precipitation: mean(numbersAt(models, (m) => m.hourly[index]?.precipitation ?? null)),
      precipitationProbability: mean(numbersAt(models, (m) => m.hourly[index]?.precipitationProbability ?? null)),
      weatherCode: consensusWeatherCode(models, index, meanTemp),
      windSpeed: mean(numbersAt(models, (m) => m.hourly[index]?.windSpeed ?? null)),
      humidity: mean(numbersAt(models, (m) => m.hourly[index]?.humidity ?? null)),
      min: temps.length > 0 ? Math.min(...temps) : null,
      max: temps.length > 0 ? Math.max(...temps) : null,
      contributing: temps.length,
    })
  }
  return points
}

export function aggregateDaily(models: ModelForecast[], dayCount: number): AggregateDailyPoint[] {
  if (models.length === 0) throw new Error('aggregateDaily needs at least one model')
  const points: AggregateDailyPoint[] = []
  for (let index = 0; index < dayCount; index += 1) {
    const date = models[0]?.daily[index]?.date ?? ''
    const highs = numbersAt(models, (m) => m.daily[index]?.tempMax ?? null)
    const lows = numbersAt(models, (m) => m.daily[index]?.tempMin ?? null)
    const codes = models
      .map((m) => m.daily[index]?.weatherCode ?? null)
      .filter((code): code is number => code !== null)
    const counts = new Map<number, number>()
    for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1)
    let weatherCode: number | null = null
    let best = -1
    for (const [code, count] of counts) {
      if (count > best || (count === best && (weatherCode === null || code < weatherCode))) {
        best = count
        weatherCode = code
      }
    }
    points.push({
      date,
      tempMax: mean(highs),
      tempMin: mean(lows),
      precipitationSum: mean(numbersAt(models, (m) => m.daily[index]?.precipitationSum ?? null)),
      weatherCode,
      windMax: mean(numbersAt(models, (m) => m.daily[index]?.windMax ?? null)),
      min: lows.length > 0 ? Math.min(...lows) : null,
      max: highs.length > 0 ? Math.max(...highs) : null,
      contributing: models.filter((m) => m.daily[index] && (m.daily[index]?.tempMax ?? null) !== null).length,
    })
  }
  return points
}

/** How much the selected models disagree at each hour, in the display unit. */
export function spreadAt(points: AggregatePoint[]): (number | null)[] {
  return points.map((point) => (point.min === null || point.max === null ? null : point.max - point.min))
}

/** The models that actually contributed to the aggregate over the window. */
export function contributingModels(models: ModelForecast[]): ModelForecast[] {
  return models.filter((model) => model.status === 'ok' && model.horizonHours > 0)
}


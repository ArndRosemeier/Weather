import type { UnitSystem } from './types'

export function convertTemp(celsius: number | null, system: UnitSystem): number | null {
  if (celsius === null) return null
  return system === 'metric' ? celsius : celsius * 9 / 5 + 32
}

export function convertWind(kmh: number | null, system: UnitSystem): number | null {
  if (kmh === null) return null
  return system === 'metric' ? kmh : kmh * 0.621371
}

export function convertPrecip(mm: number | null, system: UnitSystem): number | null {
  if (mm === null) return null
  return system === 'metric' ? mm : mm / 25.4
}

export function tempUnit(system: UnitSystem): string {
  return system === 'metric' ? '°C' : '°F'
}

export function windUnit(system: UnitSystem): string {
  return system === 'metric' ? 'km/h' : 'mph'
}

export function precipUnit(system: UnitSystem): string {
  return system === 'metric' ? 'mm' : 'in'
}

/** Whole degrees for the rounded display; the chart keeps the raw value. */
export function formatTemp(celsius: number | null, system: UnitSystem): string {
  const value = convertTemp(celsius, system)
  if (value === null) return '—'
  return `${Math.round(value)}°`
}

export function formatTempWithUnit(celsius: number | null, system: UnitSystem): string {
  const value = convertTemp(celsius, system)
  if (value === null) return '—'
  return `${Math.round(value)}${tempUnit(system)}`
}

export function formatWind(kmh: number | null, system: UnitSystem): string {
  const value = convertWind(kmh, system)
  if (value === null) return '—'
  return `${Math.round(value)} ${windUnit(system)}`
}

export function formatPrecip(mm: number | null, system: UnitSystem): string {
  const value = convertPrecip(mm, system)
  if (value === null) return '—'
  if (value === 0) return `0 ${precipUnit(system)}`
  if (value < 0.1) return `<0.1 ${precipUnit(system)}`
  if (value < 10) return `${value.toFixed(1)} ${precipUnit(system)}`
  return `${Math.round(value)} ${precipUnit(system)}`
}

export function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`
}

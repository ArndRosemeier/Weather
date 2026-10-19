import { describe, expect, it } from 'vitest'
import { convertPrecip, convertTemp, convertWind, formatPrecip, formatTemp, formatTempWithUnit, formatWind } from '../../src/lib/units'

describe('units', () => {
  it('converts and labels metric and imperial', () => {
    expect(convertTemp(0, 'imperial')).toBe(32)
    expect(convertTemp(100, 'imperial')).toBe(212)
    expect(convertWind(100, 'imperial')).toBeCloseTo(62.137, 2)
    expect(convertPrecip(25.4, 'imperial')).toBeCloseTo(1)
    expect(formatTemp(12.4, 'metric')).toBe('12°')
    expect(formatTempWithUnit(12.4, 'imperial')).toBe('54°F')
    expect(formatWind(10, 'metric')).toBe('10 km/h')
  })

  it('never renders a missing value as zero', () => {
    expect(formatTemp(null, 'metric')).toBe('—')
    expect(formatWind(null, 'imperial')).toBe('—')
    expect(formatPrecip(null, 'metric')).toBe('—')
  })

  it('formats precipitation without inventing precision', () => {
    expect(formatPrecip(0, 'metric')).toBe('0 mm')
    expect(formatPrecip(0.04, 'metric')).toBe('<0.1 mm')
    expect(formatPrecip(2.34, 'metric')).toBe('2.3 mm')
    expect(formatPrecip(14.6, 'metric')).toBe('15 mm')
    expect(formatPrecip(25.4, 'imperial')).toBe('1.0 in')
  })
})

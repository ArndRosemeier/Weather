import { describe, expect, it } from 'vitest'
import { conditionFor, heroFor, isDaylight } from '../../src/lib/wmo'

describe('WMO conditions', () => {
  it('maps representative codes to labels and icons', () => {
    expect(conditionFor(0).label).toBe('Clear sky')
    expect(conditionFor(3).icon).toBe('cloud')
    expect(conditionFor(65).label).toBe('Heavy rain')
    expect(conditionFor(95).wet).toBe(true)
    expect(conditionFor(45).icon).toBe('fog')
  })

  it('names an unknown code instead of pretending it is clear', () => {
    expect(conditionFor(199).label).toBe('Unknown conditions')
    expect(conditionFor(null).label).toBe('No data')
  })

  it('chooses day/night heroes and lets extremes win', () => {
    expect(heroFor(0, true, 20)).toBe('clear-day')
    expect(heroFor(0, false, 4)).toBe('clear-night')
    expect(heroFor(2, true, 15)).toBe('partly-cloudy-day')
    expect(heroFor(61, true, 15)).toBe('rain')
    expect(heroFor(3, true, 34)).toBe('heat')
    expect(heroFor(3, true, -9)).toBe('frost')
    expect(heroFor(3, true, 12, 70)).toBe('wind')
    expect(heroFor(61, true, 12, 70)).toBe('rain')
  })

  it('uses sunrise and sunset when present and clock hours otherwise', () => {
    expect(isDaylight('2026-01-01T05:00', '2026-01-01T08:00', '2026-01-01T16:00')).toBe(false)
    expect(isDaylight('2026-01-01T12:00', '2026-01-01T08:00', '2026-01-01T16:00')).toBe(true)
    expect(isDaylight('2026-01-01T22:00', null, null)).toBe(false)
  })
})

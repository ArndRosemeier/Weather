import { describe, expect, it } from 'vitest'
import { dayLabelIndices, daySegments, hourTicks } from '../../src/lib/timeAxis'

function hours(start: string, count: number): string[] {
  const base = new Date(`${start}:00Z`)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base.getTime() + index * 3600_000)
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:00`
  })
}

describe('chart time axis', () => {
  it('splits a window at local midnight and keeps partial days at the edges', () => {
    const segments = daySegments(hours('2026-10-19T16', 24))
    expect(segments).toHaveLength(2)
    expect(segments[0]).toMatchObject({ start: 0, end: 7, date: '2026-10-19' })
    expect(segments[1]).toMatchObject({ start: 8, end: 23, date: '2026-10-20' })
  })

  it('labels a 7-day window by day only, never by hour', () => {
    const times = hours('2026-10-19T16', 168)
    expect(hourTicks(times, 900)).toEqual([])
    // A 168-hour window that starts mid-afternoon touches eight calendar days:
    // the first and the last are partial, which is the honest picture.
    const labels = dayLabelIndices(times)
    expect(labels).toHaveLength(8)
    expect(labels.map((entry) => entry.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'])
    expect(labels[0]?.index).toBe(3)
    expect(labels[1]?.index).toBe(19)
  })

  it('keeps hour ticks on 48 hours and drops one that would collide with midnight', () => {
    // Midnight labels replace the nearby hour ticks (6 and 30 are suppressed).
    const ticks = hourTicks(hours('2026-10-19T16', 48), 900)
    expect(ticks.map((tick) => tick.index)).toEqual([12, 18, 24, 36, 42])
    expect(ticks.map((tick) => tick.label)).toEqual(['04:00', '10:00', '16:00', '04:00', '10:00'])
  })

  it('uses the wider hour step on a narrow screen', () => {
    expect(hourTicks(hours('2026-10-19T16', 48), 390).map((tick) => tick.label)).toEqual(['04:00', '16:00', '04:00'])
  })

  it('handles an empty window without inventing a day', () => {
    expect(daySegments([])).toEqual([])
    expect(hourTicks([], 900)).toEqual([])
    expect(dayLabelIndices([])).toEqual([])
  })
})

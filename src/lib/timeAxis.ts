import { dayLabel } from './format'

/** A local calendar day inside the plotted window. The first and last segments
 *  are partial when the window starts or ends away from midnight. */
export interface DaySegment {
  start: number
  end: number
  date: string
  weekday: string
}

export interface HourTick {
  index: number
  label: string
}

function segment(times: string[], start: number, end: number): DaySegment {
  const date = times[start]?.slice(0, 10) ?? ''
  return { start, end, date, weekday: dayLabel(date) }
}

/** Midnight boundaries of the plotted window, in local ISO time. */
export function daySegments(times: string[]): DaySegment[] {
  if (times.length === 0) return []
  const out: DaySegment[] = []
  let start = 0
  for (let index = 1; index < times.length; index += 1) {
    if (times[index]?.slice(11, 16) === '00:00') {
      out.push(segment(times, start, index - 1))
      start = index
    }
  }
  out.push(segment(times, start, times.length - 1))
  return out
}

/**
 * Bottom-axis hour ticks. Only windows of 48 h or less get them: a 7-day chart is
 * labelled in days on its own rail, never in hours. Ticks near a midnight are
 * suppressed because the day boundary line and label already mark that moment.
 */
export function hourTicks(times: string[], width: number): HourTick[] {
  const boundaries = daySegments(times).map((entry) => entry.start)
  const hourStep = times.length <= 24 ? 6 : times.length <= 48 ? (width < 560 ? 12 : 6) : 0
  const ticks: HourTick[] = []
  if (hourStep === 0) return ticks
  for (let index = hourStep; index < times.length; index += hourStep) {
    if (boundaries.some((start) => Math.abs(start - index) <= 2)) continue
    ticks.push({ index, label: times[index]?.slice(11, 16) ?? '' })
  }
  return ticks
}

/** Midpoint of each day band — where its name is printed on the day rail. */
export function dayLabelIndices(times: string[]): { index: number; label: string; date: string }[] {
  return daySegments(times).map((entry) => ({
    index: Math.floor((entry.start + entry.end) / 2),
    label: entry.weekday,
    date: entry.date,
  }))
}

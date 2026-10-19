export function hourLabel(iso: string): string {
  const clock = iso.slice(11, 16)
  return clock || '—'
}

export function dayLabel(isoDate: string, style: 'short' | 'long' = 'short'): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('en-GB', { weekday: style, timeZone: 'UTC' })
}

export function dateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Formats a UTC epoch for "updated at" in the location's offset. */
export function updatedLabel(fetchedAt: number, utcOffsetSeconds: number): string {
  const shifted = new Date(fetchedAt + utcOffsetSeconds * 1000)
  const hours = String(shifted.getUTCHours()).padStart(2, '0')
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/** Index of the hour the user is living in, from local ISO times plus the API's
 *  UTC offset. Never uses the browser's own timezone: the forecast is local to the
 *  place being viewed. */
export function currentHourIndex(times: string[], utcOffsetSeconds: number, now = Date.now()): number {
  if (times.length === 0) return 0
  const shifted = new Date(now + utcOffsetSeconds * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:00`
  const index = times.findIndex((time) => time >= stamp)
  if (index === -1) return times.length - 1
  return index
}

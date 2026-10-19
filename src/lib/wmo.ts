export type HeroKey =
  | 'clear-day' | 'clear-night'
  | 'partly-cloudy-day' | 'partly-cloudy-night'
  | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'heavy-rain'
  | 'thunderstorm' | 'snow' | 'wind' | 'heat' | 'frost'

export type IconKey =
  | 'sun' | 'moon' | 'cloud-sun' | 'cloud-moon' | 'cloud'
  | 'fog' | 'drizzle' | 'rain' | 'showers' | 'snow' | 'thunder' | 'unknown'

export interface Condition {
  label: string
  short: string
  icon: IconKey
  wet: boolean
}

/** WMO weather interpretation codes, as documented by Open-Meteo. */
export function conditionFor(code: number | null): Condition {
  if (code === null) return { label: 'No data', short: 'No data', icon: 'unknown', wet: false }
  switch (code) {
    case 0: return { label: 'Clear sky', short: 'Clear', icon: 'sun', wet: false }
    case 1: return { label: 'Mainly clear', short: 'Mainly clear', icon: 'cloud-sun', wet: false }
    case 2: return { label: 'Partly cloudy', short: 'Partly cloudy', icon: 'cloud-sun', wet: false }
    case 3: return { label: 'Overcast', short: 'Overcast', icon: 'cloud', wet: false }
    case 45: return { label: 'Fog', short: 'Fog', icon: 'fog', wet: false }
    case 48: return { label: 'Depositing rime fog', short: 'Rime fog', icon: 'fog', wet: false }
    case 51: return { label: 'Light drizzle', short: 'Drizzle', icon: 'drizzle', wet: true }
    case 53: return { label: 'Moderate drizzle', short: 'Drizzle', icon: 'drizzle', wet: true }
    case 55: return { label: 'Dense drizzle', short: 'Drizzle', icon: 'drizzle', wet: true }
    case 56:
    case 57: return { label: 'Freezing drizzle', short: 'Freezing drizzle', icon: 'drizzle', wet: true }
    case 61: return { label: 'Light rain', short: 'Rain', icon: 'rain', wet: true }
    case 63: return { label: 'Moderate rain', short: 'Rain', icon: 'rain', wet: true }
    case 65: return { label: 'Heavy rain', short: 'Heavy rain', icon: 'rain', wet: true }
    case 66:
    case 67: return { label: 'Freezing rain', short: 'Freezing rain', icon: 'rain', wet: true }
    case 71: return { label: 'Light snow', short: 'Snow', icon: 'snow', wet: true }
    case 73: return { label: 'Moderate snow', short: 'Snow', icon: 'snow', wet: true }
    case 75: return { label: 'Heavy snow', short: 'Heavy snow', icon: 'snow', wet: true }
    case 77: return { label: 'Snow grains', short: 'Snow', icon: 'snow', wet: true }
    case 80: return { label: 'Light showers', short: 'Showers', icon: 'showers', wet: true }
    case 81: return { label: 'Moderate showers', short: 'Showers', icon: 'showers', wet: true }
    case 82: return { label: 'Violent showers', short: 'Showers', icon: 'showers', wet: true }
    case 85:
    case 86: return { label: 'Snow showers', short: 'Snow showers', icon: 'snow', wet: true }
    case 95: return { label: 'Thunderstorm', short: 'Thunderstorm', icon: 'thunder', wet: true }
    case 96:
    case 99: return { label: 'Thunderstorm with hail', short: 'Thunderstorm', icon: 'thunder', wet: true }
    default: return { label: 'Unknown conditions', short: 'Unknown', icon: 'unknown', wet: false }
  }
}

/** Daylight from the sun's position when we have sunrise/sunset for that day, and
 *  from local clock hours otherwise. */
export function isDaylight(timeIso: string, sunrise: string | null, sunset: string | null): boolean {
  const clock = timeIso.slice(11, 16)
  if (clock.length !== 5) return true
  if (sunrise && sunset) {
    const rise = sunrise.slice(11, 16)
    const set = sunset.slice(11, 16)
    if (rise && set) return clock >= rise && clock < set
  }
  const hour = Number(clock.slice(0, 2))
  return hour >= 6 && hour < 20
}

/** The hero image family for a condition. Extremes of temperature win over a
 *  generic clear/cloud picture, which is what people actually feel. */
export function heroFor(code: number | null, daylight: boolean, tempC: number | null): HeroKey {
  if (tempC !== null && tempC >= 33) return 'heat'
  if (tempC !== null && tempC <= -8) return 'frost'
  if (code === null) return daylight ? 'overcast' : 'clear-night'
  if (code <= 1) return daylight ? 'clear-day' : 'clear-night'
  if (code === 2) return daylight ? 'partly-cloudy-day' : 'partly-cloudy-night'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'heavy-rain'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 95) return 'thunderstorm'
  return 'overcast'
}

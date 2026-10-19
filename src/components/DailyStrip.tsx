import type { AggregateDailyPoint, UnitSystem } from '../lib/types'
import { dateLabel, dayLabel } from '../lib/format'
import { conditionFor, heroFor } from '../lib/wmo'
import { formatPrecip, formatTemp, tempUnit } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  days: AggregateDailyPoint[]
  system: UnitSystem
  activeDay: number | null
  onSelectDay: (index: number) => void
}

export function DailyStrip({ days, system, activeDay, onSelectDay }: Props) {
  const spreads = days.flatMap((day) => [day.min, day.max]).filter((value): value is number => value !== null)
  const low = spreads.length > 0 ? Math.min(...spreads) : 0
  const high = spreads.length > 0 ? Math.max(...spreads) : 1
  const span = Math.max(high - low, 1)

  return (
    <div className="daily" role="group" aria-label="Daily forecast">
      {days.map((day, index) => {
        const condition = conditionFor(day.weatherCode)
        const hero = heroFor(day.weatherCode, true, day.tempMax)
        const left = day.min === null ? 0 : ((day.min - low) / span) * 100
        const right = day.max === null ? 0 : ((day.max - low) / span) * 100
        return (
          <button
            key={day.date}
            type="button"
            className={`day ${activeDay === index ? 'is-active' : ''}`}
            data-testid="day-card"
            aria-pressed={activeDay === index}
            onClick={() => onSelectDay(index)}
          >
            <div className="day__top">
              <span className="day__name">{index === 0 ? 'Today' : dayLabel(day.date)}</span>
              <span className="day__date">{dateLabel(day.date)}</span>
            </div>
            <div className="day__visual">
              <img className="day__image" src={`${import.meta.env.BASE_URL}heroes/${hero}-320.webp`} alt="" loading="lazy" decoding="async" aria-hidden="true" />
              <span className="day__icon" style={{ color: 'var(--text)' }}>
                <WeatherIcon icon={condition.icon} size={26} />
              </span>
            </div>
            <div className="day__temps">
              <span className="day__high">{formatTemp(day.tempMax, system)}</span>
              <span className="day__low">{formatTemp(day.tempMin, system)}</span>
            </div>
            <div className="day__spread" aria-hidden="true">
              <span className="day__spread-fill" style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }} />
            </div>
            <div className="day__meta">
              <span>{day.precipitationSum !== null && day.precipitationSum >= 0.1 ? formatPrecip(day.precipitationSum, system) : 'Dry'}</span>
              <span className="day__models">{day.contributing} models</span>
            </div>
            <span className="day__unit">{tempUnit(system)}</span>
          </button>
        )
      })}
    </div>
  )
}

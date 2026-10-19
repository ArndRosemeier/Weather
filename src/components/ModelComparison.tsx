import type { ModelForecast, UnitSystem } from '../lib/types'
import { formatPrecip, formatTemp, formatWind } from '../lib/units'
import { conditionFor } from '../lib/wmo'
import { WeatherIcon } from './WeatherIcon'
import { ProviderTooltip } from './ProviderTooltip'

interface Props {
  models: ModelForecast[]
  system: UnitSystem
  nowIndex: number
  dayIndex: number
  focusModelId: string | null
  onFocusModel: (id: string | null) => void
}

export function ModelComparison({ models, system, nowIndex, dayIndex, focusModelId, onFocusModel }: Props) {
  return (
    <div className="comparison">
      <table className="comparison__table">
        <caption className="sr-only">Each selected model&apos;s forecast, compared with the others</caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col">Now</th>
            <th scope="col">High</th>
            <th scope="col">Low</th>
            <th scope="col">Rain today</th>
            <th scope="col">Days covered</th>
          </tr>
        </thead>
        <tbody>
          {models.map((entry) => {
            const now = entry.hourly[nowIndex]
            const day = entry.daily[dayIndex]
            const condition = conditionFor(now?.weatherCode ?? null)
            return (
              <tr
                key={entry.model.id}
                className={`${focusModelId === entry.model.id ? 'is-focused' : ''} ${entry.status === 'unavailable' ? 'is-offline' : ''}`}
                data-testid="comparison-row"
                data-model-id={entry.model.id}
                onClick={() => onFocusModel(focusModelId === entry.model.id ? null : entry.model.id)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onFocusModel(focusModelId === entry.model.id ? null : entry.model.id)
                  }
                }}
              >
                <th scope="row">
                  <span className="comparison__swatch" style={{ background: entry.model.color }} />
                  <span className="comparison__name">{entry.model.name}</span>
                  <ProviderTooltip providerId={entry.model.providerId} className="comparison__provider" />
                </th>
                <td>
                  {entry.status === 'unavailable' ? (
                    <span className="comparison__offline">No data</span>
                  ) : (
                    <span className="comparison__now">
                      <WeatherIcon icon={condition.icon} size={16} />
                      {formatTemp(now?.temperature ?? null, system)}
                    </span>
                  )}
                </td>
                <td>{formatTemp(day?.tempMax ?? null, system)}</td>
                <td>{formatTemp(day?.tempMin ?? null, system)}</td>
                <td>{formatPrecip(day?.precipitationSum ?? null, system)}</td>
                <td className="comparison__cover">
                  {entry.status === 'unavailable' ? '—' : `${(entry.horizonHours / 24).toFixed(1)} d`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="comparison__hint">
        Click a row to focus that model in the chart. “Days covered” is how far that model forecasts on its own — always measured against the full 16-day request, not the view you selected. Wind gusts and humidity stay in the current-conditions panel.
        {models.some((entry) => entry.status === 'unavailable') ? ' “No data” means the provider returned no values for this run — it is not a zero forecast.' : ''}
      </p>
      <ul className="comparison__extra" aria-label="Wind and humidity by model">
        {models.map((entry) => {
          const now = entry.hourly[nowIndex]
          if (entry.status === 'unavailable') return null
          return (
            <li key={entry.model.id}>
              <span className="comparison__swatch" style={{ background: entry.model.color }} />
              <span className="comparison__name">{entry.model.shortName}</span>
              <span className="comparison__extra-value">{formatWind(now?.windSpeed ?? null, system)}</span>
              <span className="comparison__extra-value">{now?.humidity === null || now?.humidity === undefined ? '—' : `${Math.round(now.humidity)}%`}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

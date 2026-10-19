import type { HeroKey } from '../lib/wmo'
import { conditionFor } from '../lib/wmo'
import { formatTemp, tempUnit } from '../lib/units'
import type { UnitSystem, WeatherLocation } from '../lib/types'
import { locationLabel } from '../lib/geocode'
import { UiIcon } from './UiIcon'

interface HeroModel {
  id: string
  name: string
  color: string
  available: boolean
}

interface Props {
  location: WeatherLocation
  heroKey: HeroKey
  temperatureC: number | null
  apparentC: number | null
  weatherCode: number | null
  system: UnitSystem
  contributing: number
  selectedCount: number
  spreadC: { min: number | null; max: number | null }
  models: HeroModel[]
  loading: boolean
  onOpenLocation: () => void
}

export function Hero({ location, heroKey, temperatureC, apparentC, weatherCode, system, contributing, selectedCount, spreadC, models, loading, onOpenLocation }: Props) {
  const condition = conditionFor(weatherCode)
  const spread = spreadC.min !== null && spreadC.max !== null ? `${Math.round(spreadC.min)}–${Math.round(spreadC.max)}${tempUnit(system)}` : null

  return (
    <section className="hero" aria-labelledby="hero-place" data-loading={loading ? 'true' : 'false'}>
      <div className="hero__media" aria-hidden="true">
        <img
          className="hero__image"
          key={heroKey}
          src={`/heroes/${heroKey}-1600.webp`}
          srcSet={`/heroes/${heroKey}-800.webp 800w, /heroes/${heroKey}-1600.webp 1600w`}
          sizes="100vw"
          alt=""
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero__shade" />
      </div>

      <div className="hero__content">
        <button type="button" className="hero__place" onClick={onOpenLocation}>
          <UiIcon name="location" size={16} />
          <span id="hero-place">{locationLabel(location)}</span>
          <UiIcon name="chevron" size={14} className="hero__chevron" />
        </button>

        <div className="hero__reading">
          <h1 className="hero__temp" data-testid="hero-temp">{formatTemp(temperatureC, system)}</h1>
          <div className="hero__condition">
            <span className="hero__label" data-testid="hero-condition">{condition.label}</span>
            {apparentC !== null && (
              <span className="hero__apparent">Feels like {formatTemp(apparentC, system)}</span>
            )}
          </div>
        </div>

        <p className="hero__meta" data-testid="hero-meta">
          <span className="hero__badge">Model average</span>
          {contributing} of {selectedCount} selected models{spread ? ` · spread ${spread}` : ''}
        </p>

        <ul className="hero__models" aria-label="Models contributing to this forecast">
          {models.map((model) => (
            <li key={model.id} className="hero__model" title={model.available ? model.name : `${model.name} — unavailable right now`}>
              <span className="hero__dot" style={{ background: model.color, opacity: model.available ? 1 : 0.28 }} />
              <span className="hero__model-name">{model.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

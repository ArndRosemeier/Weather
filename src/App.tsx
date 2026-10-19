import { useCallback, useEffect, useMemo, useState } from 'react'
import { MODELS } from './lib/models'
import { fetchForecast } from './lib/api'
import { aggregateDaily, aggregateHourly } from './lib/average'
import { isFresh, readCache, writeCache } from './lib/cache'
import { currentHourIndex, updatedLabel } from './lib/format'
import { DAY_OPTIONS, loadSettings, pushRecent, saveSettings, type Settings } from './lib/settings'
import { formatPercent, formatPrecip, formatTemp, formatWind, precipUnit, tempUnit, windUnit } from './lib/units'
import { heroFor, isDaylight } from './lib/wmo'
import type { ForecastBundle, ModelStatus, WeatherLocation } from './lib/types'
import { Hero } from './components/Hero'
import { HourlyChart, type ChartMetric } from './components/HourlyChart'
import { DailyStrip } from './components/DailyStrip'
import { ModelPicker } from './components/ModelPicker'
import { ModelComparison } from './components/ModelComparison'
import { LocationSearch } from './components/LocationSearch'
import { Attribution } from './components/Attribution'
import { ErrorBanner, NoticeBanner } from './components/Banners'
import { UiIcon } from './components/UiIcon'
import { WhatsNew } from './components/WhatsNew'
import { VERSION } from './lib/version'
import { conditionFor } from './lib/wmo'

type RangeMode = '24h' | '48h' | 'all' | 'day'

const ALL_MODEL_IDS = MODELS.map((model) => model.id)

function formatCachedAt(savedAt: number, offset: number): string {
  return updatedLabel(savedAt, offset)
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [bundle, setBundle] = useState<ForecastBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cacheNotice, setCacheNotice] = useState<string | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [metric, setMetric] = useState<ChartMetric>('temperature')
  const [range, setRange] = useState<{ mode: RangeMode; day?: number }>({ mode: '48h' })
  const [focusModelId, setFocusModelId] = useState<string | null>(null)
  const [locationOpen, setLocationOpen] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const { latitude, longitude } = settings.location
  const days = settings.days
  // Fetch one day beyond the displayed window so "7 days" really is 168 hours
  // from now, not "the rest of today plus six days". The strip still shows `days`.
  const fetchDays = Math.min(days + 1, 16)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    const location = settings.location
    const cached = readCache(location.latitude, location.longitude, fetchDays)

    if (cached) {
      setBundle({ ...cached.bundle, location })
      setCacheNotice(isFresh(cached.savedAt) ? null : `Showing the cached forecast from ${formatCachedAt(cached.savedAt, cached.bundle.utcOffsetSeconds)}.`)
      setLoading(false)
    } else {
      setBundle(null)
      setLoading(true)
    }
    setRefreshing(true)
    setError(null)

    fetchForecast(
      { latitude: location.latitude, longitude: location.longitude, modelIds: ALL_MODEL_IDS, days: fetchDays },
      { signal: controller.signal },
    )
      .then((fresh) => {
        if (cancelled) return
        const next = { ...fresh, location }
        setBundle(next)
        setCacheNotice(null)
        writeCache(next, fetchDays)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof Error ? cause.message : 'The forecast could not be loaded.')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
    // `settings.location` is identified by its coordinates; a rename must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, days, fetchDays, attempt])

  const selectedModels = useMemo(
    () => (bundle ? bundle.models.filter((entry) => settings.modelIds.includes(entry.model.id)) : []),
    [bundle, settings.modelIds],
  )
  const availableModels = useMemo(() => selectedModels.filter((entry) => entry.status === 'ok'), [selectedModels])

  const availability = useMemo(() => {
    const map: Record<string, ModelStatus> = {}
    for (const entry of bundle?.models ?? []) map[entry.model.id] = entry.status
    return map
  }, [bundle])

  const horizons = useMemo(() => {
    const map: Record<string, number> = {}
    for (const entry of bundle?.models ?? []) map[entry.model.id] = entry.horizonHours
    return map
  }, [bundle])

  const nowIndex = bundle ? currentHourIndex(bundle.hourlyTimes, bundle.utcOffsetSeconds) : 0
  const aggregate = useMemo(
    () => (bundle && availableModels.length > 0 ? aggregateHourly(availableModels, bundle.hourlyTimes.length) : []),
    [bundle, availableModels],
  )
  const daily = useMemo(
    () => (bundle && availableModels.length > 0 ? aggregateDaily(availableModels, Math.min(bundle.dailyDates.length, days)) : []),
    [bundle, availableModels, days],
  )
  const now = aggregate[nowIndex]

  const firstDaily = availableModels[0]?.daily[0]
  const daylight = bundle ? isDaylight(bundle.hourlyTimes[nowIndex] ?? '', firstDaily?.sunrise ?? null, firstDaily?.sunset ?? null) : true
  const heroKey = heroFor(now?.weatherCode ?? null, daylight, now?.temperature ?? null, now?.windSpeed ?? null)

  const windowHours = days * 24
  const total = aggregate.length
  const clampedNow = Math.min(nowIndex, Math.max(0, total - 1))
  const start = range.mode === 'day' ? Math.min((range.day ?? 0) * 24, Math.max(0, total - 1)) : clampedNow
  const end =
    range.mode === '24h' || range.mode === 'day'
      ? Math.min(total, start + 24)
      : range.mode === '48h'
        ? Math.min(total, start + 48)
        : Math.min(total, start + days * 24)
  const points = aggregate.slice(start, Math.max(start + 1, end))

  const chartModels = availableModels.map((entry) => ({
    id: entry.model.id,
    name: entry.model.shortName,
    color: entry.model.color,
    values: entry.hourly.slice(start, Math.max(start + 1, end)).map((point) => point[metric === 'temperature' ? 'temperature' : metric === 'wind' ? 'windSpeed' : 'precipitation']),
  }))

  const chooseLocation = (location: WeatherLocation) => {
    setFocusModelId(null)
    updateSettings({ location, recent: pushRecent(settings, location) })
  }

  const refresh = () => setAttempt((value) => value + 1)

  const selectDay = (index: number) => {
    setRange({ mode: 'day', day: index })
    window.setTimeout(() => document.getElementById('hourly')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20)
  }

  const modelsForHero = selectedModels.map((entry) => ({
    id: entry.model.id,
    name: entry.model.shortName,
    color: entry.model.color,
    available: entry.status === 'ok',
  }))

  const condition = conditionFor(now?.weatherCode ?? null)

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to forecast</a>

      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <img className="brand__mark" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={30} height={30} />
            <span className="brand__name">Weather Compare</span>
            <span className="brand__version" data-testid="app-version">v{VERSION}</span>
          </div>
          <div className="topbar__actions">
            <button type="button" className="whats-new" data-testid="whats-new" onClick={() => setWhatsNewOpen(true)}>
              <UiIcon name="info" size={16} />
              <span>What&apos;s new</span>
            </button>
            <button type="button" className="location-button" onClick={() => setLocationOpen(true)}>
              <UiIcon name="location" size={16} />
              <span>{settings.location.name}</span>
            </button>
            <div className="segmented" role="group" aria-label="Units">
              <button type="button" aria-pressed={settings.system === 'metric'} onClick={() => updateSettings({ system: 'metric' })} data-testid="unit-metric">°C</button>
              <button type="button" aria-pressed={settings.system === 'imperial'} onClick={() => updateSettings({ system: 'imperial' })} data-testid="unit-imperial">°F</button>
            </div>
            <button type="button" className="icon-button" onClick={refresh} disabled={refreshing} aria-label="Refresh forecast" data-testid="refresh">
              <UiIcon name="refresh" size={18} className={refreshing ? 'spin' : undefined} />
            </button>
          </div>
        </div>
      </header>

      {error && <ErrorBanner message={error} onRetry={refresh} onDismiss={() => setError(null)} />}
      {!online && <NoticeBanner>You are offline — showing the last forecast saved on this device.</NoticeBanner>}
      {cacheNotice && <NoticeBanner>{cacheNotice}</NoticeBanner>}

      <Hero
        location={settings.location}
        heroKey={heroKey}
        temperatureC={now?.temperature ?? null}
        apparentC={now?.apparentTemperature ?? null}
        weatherCode={now?.weatherCode ?? null}
        system={settings.system}
        contributing={now?.contributing ?? 0}
        selectedCount={selectedModels.length}
        spreadC={{ min: now?.min ?? null, max: now?.max ?? null }}
        models={modelsForHero}
        loading={loading}
        onOpenLocation={() => setLocationOpen(true)}
      />

      <main id="main" className="main">
        {loading && !bundle && (
          <div className="skeleton-grid" aria-live="polite" aria-busy="true">
            <p className="sr-only">Loading the forecast.</p>
            {[0, 1, 2, 3].map((index) => <div key={index} className="skeleton" />)}
          </div>
        )}

        {!loading && !bundle && (
          <section className="panel panel--empty" role="status">
            <h2 className="panel__title">No forecast to show</h2>
            <p className="panel__sub">The forecast could not be loaded and nothing is cached for this place yet. Check the connection and retry.</p>
            <button type="button" className="button" onClick={refresh}>Try again</button>
          </section>
        )}

        {bundle && (
          <>
            <section className="stats" aria-label="Current conditions">
              <div className="stat">
                <span className="stat__label">Now</span>
                <span className="stat__value" data-testid="stat-now">{formatTemp(now?.temperature ?? null, settings.system)}</span>
                <span className="stat__sub">{condition.short} · average</span>
              </div>
              <div className="stat">
                <span className="stat__label">Rain</span>
                <span className="stat__value" data-testid="stat-rain">{formatPrecip(now?.precipitation ?? null, settings.system)}</span>
                <span className="stat__sub">{formatPercent(now?.precipitationProbability ?? null)} chance · per hour</span>
              </div>
              <div className="stat">
                <span className="stat__label">Wind</span>
                <span className="stat__value" data-testid="stat-wind">{formatWind(now?.windSpeed ?? null, settings.system)}</span>
                <span className="stat__sub">average of {now?.contributing ?? 0} models</span>
              </div>
              <div className="stat">
                <span className="stat__label">Humidity</span>
                <span className="stat__value" data-testid="stat-humidity">{formatPercent(now?.humidity ?? null)}</span>
                <span className="stat__sub">updated {updatedLabel(bundle.fetchedAt, bundle.utcOffsetSeconds)}</span>
              </div>
            </section>

            <section className="panel" id="hourly" aria-labelledby="hourly-title">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Model comparison</p>
                  <h2 className="panel__title" id="hourly-title">Hour by hour</h2>
                  <p className="panel__sub">
                    White is the average of {availableModels.length} model{availableModels.length === 1 ? '' : 's'}; each coloured line is one model.
                    {metric === 'temperature' && ' The shaded band is the spread between the warmest and coldest model.'}
                  </p>
                </div>
                <div className="panel__controls">
                  <div className="segmented" role="group" aria-label="Metric">
                    <button type="button" aria-pressed={metric === 'temperature'} onClick={() => setMetric('temperature')}>Temp</button>
                    <button type="button" aria-pressed={metric === 'precipitation'} onClick={() => setMetric('precipitation')}>Rain</button>
                    <button type="button" aria-pressed={metric === 'wind'} onClick={() => setMetric('wind')}>Wind</button>
                  </div>
                  <div className="segmented" role="group" aria-label="Time range">
                    <button type="button" aria-pressed={range.mode === '24h'} onClick={() => setRange({ mode: '24h' })}>24h</button>
                    <button type="button" aria-pressed={range.mode === '48h'} onClick={() => setRange({ mode: '48h' })}>48h</button>
                    <button type="button" aria-pressed={range.mode === 'all'} data-testid="range-all" onClick={() => setRange({ mode: 'all' })}>{days} days</button>
                  </div>
                </div>
              </div>
              <HourlyChart
                points={points}
                models={chartModels}
                metric={metric}
                system={settings.system}
                focusModelId={focusModelId}
                onFocusModel={setFocusModelId}
              />
              <p className="chart__unit-note">
                {metric === 'temperature' ? `${tempUnit(settings.system)} · hourly` : metric === 'precipitation' ? `${precipUnit(settings.system)} per hour` : windUnit(settings.system)}
                {points.length > 0 && ` · ${points.length} hours from ${points[0]?.time.slice(11, 16)}`}
              </p>
            </section>

            <section className="panel" aria-labelledby="daily-title">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">The week</p>
                  <h2 className="panel__title" id="daily-title">Day by day</h2>
                  <p className="panel__sub">
                    Daily values are averaged per model; the bar shows the spread between the coolest and warmest model.
                    {settings.days > 10 ? ' Beyond ten days the models disagree sharply — read the spread, not just the average.' : ''}
                  </p>
                </div>
                <div className="panel__controls">
                  <div className="segmented" role="group" aria-label="Forecast length">
                    {DAY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={settings.days === option}
                        data-testid={`horizon-${option}`}
                        onClick={() => updateSettings({ days: option })}
                      >
                        {option} days
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DailyStrip
                days={daily}
                system={settings.system}
                activeDay={range.mode === 'day' ? (range.day ?? null) : null}
                onSelectDay={selectDay}
              />
            </section>

            <section className="panel" id="models" aria-labelledby="models-title">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Your forecast</p>
                  <h2 className="panel__title" id="models-title">Choose the models</h2>
                  <p className="panel__sub">
                    One entry per base model. Regional variants, ensemble members and repackaged copies of the same model are excluded — see “Why only these models?” below.
                  </p>
                </div>
              </div>
              <ModelPicker
                selectedIds={settings.modelIds}
                windowHours={windowHours}
                onChange={(ids) => updateSettings({ modelIds: ids })}
                availability={availability}
                horizons={horizons}
                focusModelId={focusModelId}
                onFocusModel={setFocusModelId}
              />
            </section>

            <section className="panel" aria-labelledby="comparison-title">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Side by side</p>
                  <h2 className="panel__title" id="comparison-title">Model by model</h2>
                  <p className="panel__sub">Today&apos;s numbers from every selected model, plus how far ahead each one actually forecasts.</p>
                </div>
              </div>
              <ModelComparison
                models={selectedModels}
                system={settings.system}
                nowIndex={nowIndex}
                dayIndex={0}
                windowHours={windowHours}
                focusModelId={focusModelId}
                onFocusModel={setFocusModelId}
              />
            </section>
          </>
        )}
      </main>

      <Attribution />

      <WhatsNew open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />

      <LocationSearch
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={chooseLocation}
        recent={settings.recent}
        onError={setError}
      />
    </div>
  )
}

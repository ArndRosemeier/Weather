import { useEffect, useRef, useState } from 'react'
import { PRESET_LOCATIONS, searchLocations, type GeoResult } from '../lib/geocode'
import { locationLabel } from '../lib/geocode'
import type { WeatherLocation } from '../lib/types'
import { UiIcon } from './UiIcon'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (location: WeatherLocation) => void
  recent: WeatherLocation[]
  onError: (message: string) => void
}

export function LocationSearch({ open, onClose, onSelect, recent, onError }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const [locating, setLocating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    setTouched(false)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setBusy(false)
      return
    }
    const controller = new AbortController()
    setBusy(true)
    const timer = window.setTimeout(() => {
      searchLocations(trimmed, controller.signal)
        .then((found) => {
          if (controller.signal.aborted) return
          setResults(found)
          setTouched(true)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          if (error instanceof DOMException && error.name === 'AbortError') return
          onError(error instanceof Error ? error.message : 'Location search failed.')
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false)
        })
    }, 280)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, open, onError])

  if (!open) return null

  const choose = (location: WeatherLocation) => {
    onSelect(location)
    onClose()
  }

  const locate = () => {
    if (!('geolocation' in navigator)) {
      onError('This browser does not expose a location. Search for a city instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        choose({
          name: 'My location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        setLocating(false)
        onError(`Could not read your location (${error.message}). Search for a city instead.`)
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    )
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="location-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet__head">
          <h2 id="location-title">Choose a location</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close location picker">
            <UiIcon name="close" size={18} />
          </button>
        </div>

        <div className="search">
          <UiIcon name="search" size={18} className="search__icon" />
          <input
            ref={inputRef}
            className="search__input"
            type="search"
            placeholder="City, town or postcode…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search for a location"
            autoComplete="off"
          />
        </div>

        <div className="sheet__body">
          {query.trim().length >= 2 && (
            <section aria-label="Search results" className="search__results">
              {busy && <p className="search__status">Searching…</p>}
              {!busy && touched && results.length === 0 && <p className="search__status">No places found for “{query.trim()}”.</p>}
              {results.map((result) => (
                <button key={`${result.id}-${result.latitude}`} type="button" className="result" onClick={() => choose(result)}>
                  <span className="result__name">{result.name}</span>
                  <span className="result__meta">{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
                  <span className="result__coords">{result.latitude.toFixed(2)}, {result.longitude.toFixed(2)}</span>
                </button>
              ))}
            </section>
          )}

          <button type="button" className="locate" onClick={locate} disabled={locating}>
            <UiIcon name="location" size={18} />
            {locating ? 'Reading your location…' : 'Use my location'}
          </button>

          {recent.length > 0 && (
            <section aria-label="Recent locations" className="sheet__section">
              <h3 className="sheet__section-title">Recent</h3>
              <div className="preset-list">
                {recent.map((location) => (
                  <button key={`${location.name}-${location.latitude}`} type="button" className="preset" onClick={() => choose(location)}>
                    {locationLabel(location)}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section aria-label="Popular locations" className="sheet__section">
            <h3 className="sheet__section-title">Popular</h3>
            <div className="preset-list">
              {PRESET_LOCATIONS.map((location) => (
                <button key={location.name} type="button" className="preset" onClick={() => choose(location)}>
                  {location.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

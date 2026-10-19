# Architecture — the seam index

One static SPA. No backend, no API key, no database. The browser talks directly to
Open-Meteo (CORS `*`, verified 2026-10-19). Everything the user sees is derived from
one forecast response.

## Layer map

```
index.html / src/main.tsx        shell, PWA registration
src/App.tsx                      state owner: location, models, units, window, error
src/lib/api.ts                   URL builder + response validation/parsing (THE boundary)
src/lib/models.ts                catalogue, base-model dedupe, exclusions (THE seam)
src/lib/average.ts               null-aware aggregate + spread + consensus code
src/lib/wmo.ts                   WMO code → label/icon/hero, daylight rule
src/lib/units.ts                 the only place a unit conversion happens
src/lib/cache.ts                 localStorage cache, TTL, stale fallback
src/lib/settings.ts              persisted user preferences (location/models/units)
src/components/                  one component per visual seam
scripts/generate-heroes.mjs      hero prompts + WebP pipeline (or image, Meta Muse)
public/sw.js                     offline shell only — never API data
```

## Seams — the one way to do X

| X | The seam | Rule |
| --- | --- | --- |
| Add a forecast model | `src/lib/models.ts` | Needs `baseModel`; if it duplicates one, add to `SUPERSEDED` instead and say why. Test: `tests/unit/models.test.ts`. |
| Build/fetch a forecast | `buildForecastUrl` + `fetchForecast` | Never hand-build an Open-Meteo URL elsewhere. |
| Read the API payload | `parseForecast` | Validates structure, throws `WeatherApiError`, preserves nulls. |
| Compute the average | `aggregateHourly` / `aggregateDaily` | Mean over non-null contributors only; never substitutes 0. |
| Convert a unit | `src/lib/units.ts` | No inline `* 9/5` anywhere else. |
| Map a weather code | `conditionFor` / `heroFor` | Unknown code is labelled "Unknown conditions". |
| Cache a forecast | `src/lib/cache.ts` | TTL 20 min; stale data is shown with a notice, never silently refreshed. |
| Render an error | `src/components/ErrorBanner.tsx` | Fed by `App`'s single `error` state. |
| Generate hero art | `scripts/generate-heroes.mjs` | Prompts live in the script; output is WebP at 320/800/1600. |

## The data contract (measured 2026-10-19)

- Multi-model request: `&models=a,b,c`. Variables come back **suffixed**
  (`temperature_2m_ecmwf_ifs`). A *single*-model request comes back unsuffixed — both
  shapes are supported and tested.
- `forecast_days=N` always returns `N*24` hours. **Beyond a model's horizon the values
  are `null`.** The app measures each model's horizon from the data and never draws
  past it.
- Horizons differ materially (measured): IFS ~15 d · GFS 16 d · JMA ~11 d · GEM 10 d ·
  ICON ~7.6 d · UKMO ~7 d · CMA ~5.5 d · ARPEGE ~4.6 d.
- Some models intermittently return **all-null** (AIFS, GraphCast, BOM were offline
  during the first capture). That is data, not an error: the model is listed as
  unavailable and excluded from the average.
- Do **not** assume one long request keeps every model alive; three models returned
  all-null for a 16-day window while working for 7 days. The app asks for the selected
  window and treats nulls honestly.
- `timezone=auto` returns local ISO times plus `utc_offset_seconds`; all formatting
  uses those, never `Date`'s local zone.

## Aggregation semantics

- Hourly: unweighted mean across selected models **with data at that hour**; `min`/`max`
  are the model spread; `contributing` is the count.
- Weather symbol: modal WMO code, ties broken by the model closest to the mean
  temperature, then by code — deterministic.
- Daily: mean of each model's daily max/min (not the max of the averaged curve), so
  the daily card matches "what the models say" rather than a derived curve.
- Models with `status: 'unavailable'` are excluded and shown greyed with a reason.

## PWA

`public/sw.js` caches the app shell and hashed assets only, cache-first, with a
navigation fallback to `/index.html`. Forecast responses are cached by the app in
`localStorage` (TTL 20 min) so an offline reload still renders the last good data with
an explicit "cached" notice. The service worker never caches API responses — two
caches for one truth is a bug factory.

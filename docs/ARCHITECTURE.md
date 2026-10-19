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
src/lib/timeAxis.ts              day segments + axis ticks (chart borders/labels)
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
| Place chart day borders and labels | `daySegments` / `dayLabelIndices` / `hourTicks` | Day names sit on a centred rail; day borders are verticals at local midnight; hour ticks exist only for windows ≤ 48 h. |
| Cache a forecast | `src/lib/cache.ts` | TTL 20 min; stale data is shown with a notice, never silently refreshed. |
| Render an error | `src/components/ErrorBanner.tsx` | Fed by `App`'s single `error` state. |
| Generate hero art | `scripts/generate-heroes.mjs` | Prompts live in the script; output is WebP at 1600/800/320 (1600×1067, 3:2). Never hand-edit `public/heroes/` — regenerate. |

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
- The app fetches **one day more than it displays** (`days + 1`, capped at 16) so that a
  "7 days" view is 168 hours from now rather than "the rest of today plus six days".
  The daily strip still shows `days` cards. A 168-hour window that starts mid-afternoon
  touches eight calendar dates; the axis says so rather than rounding it away.
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

## Hero art pipeline

One script, `scripts/generate-heroes.mjs`, is the only way a hero exists. It calls
`or image` once per condition family with `--model meta/muse-image --aspect 3:2
--resolution 2K`, appending a shared `STYLE` suffix that carries the readability
contract for every key: cinematic landscape photograph, no people, no text, no
watermark, no logos, subject centred, and the lower third calm and uncluttered for a
text overlay. A prompt that fights the overlay is a bug in the prompt, not a
post-processing problem.

- **Raw.** `assets/raw-heroes/<key>.webp`, 1920×1280, gitignored. The provider returns
  **WebP regardless of the `.png` output path**, so the script re-encodes from
  whichever file actually appeared (the printed CLI path is authoritative) and never
  trusts the extension.
- **Skip semantics.** A raw that already exists is skipped. Regenerating one key is
  therefore: delete `assets/raw-heroes/<key>.webp` *and* `public/heroes/<key>-*.webp`,
  rerun — the other 13 are untouched and nothing is paid for twice. Policy is at most
  two attempts per key.
- **Derived.** `public/heroes/<key>-{1600,800,320}.webp`, a centre `cover` crop at 3:2
  (1600×1067 · 800×533 · 320×213), WebP quality **80** at 1600 and **76** at the two
  small widths. 1600 is the desktop/retina source, 800 the phone default, 320 the
  thumbnail. Measured set: 42 files, 2,044,774 B total (the 1600 files alone 1.44 MB).
- **Icons.** Rendered from `public/icon.svg` in the same run — 192 and 512 for the
  manifest (`any`), 180 for `apple-touch-icon.png` (wired in `index.html`), and a
  separate full-bleed `public/icon-maskable.svg` → `icon-512-maskable.png` for the
  Android mask, so the rounded brand tile is never cropped by the mask. The SVG is the
  only icon source; no PNG is hand-drawn.
- **The key set is the contract** with `HeroKey` in `src/lib/wmo.ts`: adding a family
  means a prompt entry *and* a `HeroKey`, and `heroFor` must be able to return it.
  `wind` is reachable through a wind-speed rule (≥ 55 km/h and no precipitation);
  `tests/unit/hero-assets.test.ts` pins all 14 keys to their 42 files and the icon
  set, so a missing or renamed asset fails the unit suite instead of degrading the
  hero silently.

## Responsive layout rule

`.main > *` and `.panel` carry `min-width: 0`, and the model-by-model table lives
inside `.comparison` (`overflow-x: auto`) with `min-width: 620px`. Without that,
the table's min-content width widens its grid parent, and a mobile browser expands
its **layout viewport** to fit — everything stays technically in bounds
(`scrollWidth === innerWidth`) while the whole app shrinks and clips. The mobile E2E
pins `window.innerWidth <= 430` for exactly this reason. The chart, like the table,
must never set the page's min-content width.

## PWA

`public/sw.js` caches the app shell and hashed assets only, cache-first, with a
navigation fallback to `/index.html`. Forecast responses are cached by the app in
`localStorage` (TTL 20 min) so an offline reload still renders the last good data with
an explicit "cached" notice. The service worker never caches API responses — two
caches for one truth is a bug factory.

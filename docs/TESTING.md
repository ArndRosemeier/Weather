# Testing — what proves this

Two tiers, one gate. `bash scripts/gate.sh`.

| Tier | Command | Question | Exit |
| --- | --- | --- | --- |
| Cheap | `GATE_TESTS=0 bash scripts/gate.sh` → `pnpm run build` | does it typecheck and build? | `0`/`1`/`2` |
| Full | `bash scripts/gate.sh` → `pnpm run verify` (build + unit + e2e) | did behaviour move? | `0`/`1`/`9` |

`0` green · `1` red (read the raw log) · `2` cheap passed, suite did not run ·
`9` lock refused (VOID). Never pipe a gate through `tail`/`head`.

## What each layer proves

| Layer | File | Proves |
| --- | --- | --- |
| Unit | `tests/unit/models.test.ts` | no base model is reported twice; one entry per base; every exclusion names its base |
| Unit | `tests/unit/api.test.ts` | URL shape, suffix handling, null preservation, loud failures, per-model availability |
| Unit | `tests/unit/average.test.ts` | null-aware mean, spread band, consensus code, no-zero substitution, daily semantics |
| Unit | `tests/unit/units.test.ts` | conversions and "—" for missing values |
| Unit | `tests/unit/wmo.test.ts` | code → label/icon, day/night hero, temperature extremes, unknown-code honesty (`HeroKey` is a compile-time union; no test pins the 14 keys to the 42 files — see *Image artefacts*) |
| Unit | `tests/unit/cache.test.ts` | TTL, corrupt entries, storage that throws |
| Unit | `tests/unit/hero-assets.test.ts` | all 14 hero families × 3 widths exist as real WebP; icons and manifest entries resolve |
| E2E | `tests/e2e/*.spec.ts` | real UI at 390 px and 1440 px against recorded fixtures (deterministic, no live API); includes day borders at 48 h and 7 days, a phone no-overlap check on the day rail, provider tooltips on hover/keyboard/Escape, a 16-day view that proves `forecast_days=16` is requested, a request-count assertion that switching 7/10/16 does not refetch, legend coverage, and the version badge / What's-new history |
| Live | `tests/e2e/live.spec.ts` (`LIVE=1`) | the real Open-Meteo contract still holds; waits for the mounted hero bitmap, records `artifacts/live-smoke.json` |

## Fixtures

`tests/fixtures/berlin-7d.json` is a **real captured response** (2026-10-19) for 11
models, 7 days, all variables. Three models were genuinely unavailable at capture
time — that is used deliberately to test the unavailable state. `berlin-7d-all.json`
is derived from it with deterministic perturbations so every-model aggregates can be
tested; the transformation is in `tests/fixtures/derive-all.mjs`.

E2E intercepts `**/v1/forecast**` and `**/v1/search**`; no test depends on the live
service except the opt-in live spec. Because the app now asks for one day more than it
displays, the route extends the 7-day fixture to the requested `forecast_days` by
repeating its last day — deterministic test data, never shipped. The browser clock is
pinned to the fixture's date so "now", and every day-boundary assertion, stays stable.
Playwright's `baseURL` is `http://127.0.0.1:4173/weather/` (Vite `base`), tests boot
from `./`, and the manifest is fetched relatively so the deployed sub-path is exercised
rather than assumed.

## Image artefacts (heroes + icons)

`tests/unit/hero-assets.test.ts` pins the file contract (14 keys × 3 widths, real WebP
magic, icons referenced by the manifest, apple-touch link in the HTML). What it cannot
judge is the picture, so the art check is a command plus human judgement:

- **Count and geometry** (`tests/unit/hero-assets.test.ts`, plus a one-off sharp
  metadata read): `public/heroes/*.webp` = 42 (14 `HeroKey`s × 1600/800/320); every
  `-1600` is 1600×1067, `-800` 800×533, `-320` 320×213 — the 3:2 centre crop, never
  letterboxed.
- **Icons** (sharp metadata): `public/icon-192.png` 192×192, `public/icon-512.png`
  512×512, `public/apple-touch-icon.png` 180×180.
- **Bytes:** the unit test applies per-width floors (320 > 2 KB, 800 > 6 KB, 1600 >
  20 KB) purely as a degenerate-output alarm. The original 60 KB floor for a 1600 px
  file was wrong and cost a red unit run: `clear-day` 41 KB and `overcast` 39 KB are
  deliberately smooth, low-frequency skies, and a 320 px sky is legitimately ~4 KB.
  A q88 re-encode was measured at +60% bytes with no visible or measurable gain (170 vs
  173 distinct levels in a 3× crop), so encoding stays q80.
- **Look:** open every 1600 px file and judge it against the art-direction bar — no text,
  letters, watermarks or logos; no people; the subject matches its `HeroKey`;
  photographic rather than illustrated; a calm lower third; no two keys near-duplicates.
  Per-key verdicts and sizes live in `docs/DECISION-LEDGER.md` (row 5 evidence). A frame
  that fails gets its key regenerated: delete the raw plus its three widths, rerun
  `node scripts/generate-heroes.mjs`, at most two attempts.
- **Lower-third busyness** is measurable instead of arguable: RMS Laplacian of the bottom
  third per key (recorded in the ledger). Read it as texture, not clutter — `snow` scores
  21.7 purely from falling flakes over a clean slope, while the two urban scenes
  (drizzle 15.3, rain 14.9) are the ones that need the UI's text scrim.

The unit test proves presence and encoding, not quality: the cheap gate passing says
nothing about how a hero looks, so opening the frames at 1600 px is still the check.

## Evidence rules

- Keep raw gate logs in `.gate-logs/` (gitignored).
- E2E writes screenshots for the dispatcher's own review to `artifacts/` — inspect
  them; a passing assertion is not a visual check.
- A screenshot with a layout defect outranks a green assertion. A measured case: at
  390 px the app laid out at 1140 px and scaled down while `scrollWidth - innerWidth`
  was 0; the mobile spec now pins `window.innerWidth <= 430` and a chart/table
  screenshot is reviewed on every UI landing.
- `artifacts/mobile-hero-390.png`, `mobile-chart-390.png`, `mobile-7day.png`,
  `desktop-1440.png`, `desktop-48h.png`, `desktop-7day.png`,
  `desktop-provider-tooltip.png`, `desktop-whatsnew.png` and
  `desktop-chart-tooltip.png` are the dispatcher's review set; they are gitignored,
  regenerated by every E2E run.

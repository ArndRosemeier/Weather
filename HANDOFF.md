# Handoff

**State (2026-10-19T16:49Z):** DONE, verified and pushed. Latest full gate on
`5e5d8f2`: **exit 0**, 45/45 unit (11 files), 16 E2E passed / 1 skipped, 34 s.
That landing is **version 1.01**: the chart legend says how many days each model
covers, the app always fetches 16 days, and changing 7/10/16 no longer refetches. Earlier landings: 7/10/16-day horizon, `/weather/` deploy
reconciliation, MIT license, day-bounded chart, provider tooltips.

**Version rule (owner):** the visible version rises by **0.01 on every push**.
Before the next push: `pnpm release --title "…" --note "…"` (writes
`src/data/version.json` and `package.json`), then commit, gate, push. Next
version is 1.02. Full gate on
`db014a0` — **exit 0**, 30/30 unit (7 files), 11 E2E passed / 1 skipped, 25 s,
lock acquired. Repository public at `https://github.com/ArndRosemeier/Weather`; live at
`https://apps.futuremagic.de/weather/` (the deployed build lags HEAD until a
separate publish run — deploying is outside this session's remit). Every commit that
reaches `main` is pushed only after its own full gate; `git ls-remote origin
refs/heads/main` is the authority for the current sha. MIT licensed. Earlier records: full gate on `909d490`
(exit 0) and cheap tier on `9c2965b` (exit 2, docs-only delta — not a full pass). Live contract check passed separately against the real
Open-Meteo API (8 of 11 models had data; AIFS, GraphCast, BOM were offline).
Screenshots reviewed by the dispatcher: desktop 1440, mobile 390, mobile chart,
tooltip, and a live full-page render.

## What exists

- **Data core** (`src/lib/`): 11 models, one per base model, 18 documented
  exclusions; boundary-validated client; null-aware hourly/daily aggregation;
  units; WMO → label/icon/hero; 20-minute cache; persisted settings.
- **UI** (`src/App.tsx`, `src/components/`): hero with generated art, stats, hourly
  SVG chart (average + per-model + spread band + tooltip/keyboard), daily strip,
  model picker (physics/AI, availability, horizon), model-by-model table, location
  sheet (search/geolocate/presets/recents), PWA shell and service worker.
- **Tests**: 30 unit (`pnpm test:unit`), 11 E2E passed + 1 opt-in live
  (`pnpm test:e2e`, `LIVE=1`). Playwright drives system Chrome against recorded
  fixtures — including a real capture with three models offline.
- **Docs**: `README.md`, `docs/ARCHITECTURE.md` (seam index and data contract),
  `docs/TESTING.md`, `docs/DECISION-LEDGER.md` (rows 1–11), this file, board.

## How to run

```bash
pnpm install
pnpm dev                      # http://localhost:5173
pnpm build && pnpm preview    # http://localhost:4173
bash scripts/gate.sh          # build + unit + Playwright; exit 0 green
```

`origin` is `https://github.com/ArndRosemeier/Weather`. The owner reversed the
original no-push rule on 2026-10-19 ("Please push to here") — see ledger row 14.
Push only when he asks; never force-push `main`; there is still no deploy step.

## What is next

Nothing is owed. The app is complete and tested. If a successor picks this up:

1. Re-run `bash scripts/gate.sh` before changing anything (exit 9 = lock busy).
2. Known, deliberate non-goals: no backend, no saved accounts, no license file
   (owner decision), no deployment.
3. Horizon reference, measured 2026-10-19: IFS 15.0 d, GFS 16.0 d, JMA 11.3 d,
   GEM 10.0 d, ICON 7.5 d, UKMO 7.0 d, ARPEGE 4.5 d, CMA 5.4 d; AIFS/GraphCast/BOM
   were offline. Only IFS and GFS reliably exceed a week.

## Traps already known

- Open-Meteo returns **nulls past a model's horizon**; never render them as 0.
- AIFS / GraphCast / BOM intermittently return all-null; that is a visible
  `unavailable` state, not an error.
- Multi-model variables are **suffixed**; single-model responses are not.
- A wide child (the comparison table) can expand the mobile **layout viewport**
  without changing `scrollWidth`; `min-width: 0` is load-bearing.
- The full E2E command must end with `code=$?; exit $code` or its failure is masked.

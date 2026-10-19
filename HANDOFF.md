# Handoff

**State (2026-10-19T14:52Z):** DONE and verified. Full gate on `909d490`:
**exit 0**, 30/30 unit (7 files), 11 E2E passed / 1 skipped (opt-in live),
27 s, lock acquired. Live contract check passed separately against the real
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

No git remote exists and none may be added: the owner's standing rule is "do not
push". There is no deploy step.

## What is next

Nothing is owed. The app is complete and tested. If a successor picks this up:

1. Re-run `bash scripts/gate.sh` before changing anything (exit 9 = lock busy).
2. Known, deliberate non-goals: no backend, no saved accounts, no license file
   (owner decision), no deployment, no git remote.

## Traps already known

- Open-Meteo returns **nulls past a model's horizon**; never render them as 0.
- AIFS / GraphCast / BOM intermittently return all-null; that is a visible
  `unavailable` state, not an error.
- Multi-model variables are **suffixed**; single-model responses are not.
- A wide child (the comparison table) can expand the mobile **layout viewport**
  without changing `scrollWidth`; `min-width: 0` is load-bearing.
- The full E2E command must end with `code=$?; exit $code` or its failure is masked.

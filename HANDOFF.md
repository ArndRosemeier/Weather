# Handoff

**State (2026-10-27T09:20+01:00 · 08:20Z):** DONE and verified locally; the push
path is now **SSH** (owner changed it): `ssh -T git@github.com` answers
`Hi ArndRosemeier!`, `git ls-remote origin` exits 0, and `github.com` URLs are
rewritten by `url.insteadOf` in `~/.gitconfig`. Remotes are unchanged and no token
or credential helper is used — the earlier 403 was the withdrawn token path.
Version **1.03** (resumed PWA refetches) plus the record repairs are **pushed**:
`7d119dc..fd79401`, local == remote. Latest full gate: **exit 0**, 47/47 unit
(12 files), 19 E2E passed / 1 skipped. Next version is **1.04**.

The earlier record in this file **and** in `docs/BOARD.md` had drifted (handoff
claimed 30 unit tests, rows 1–11, "no license"; the board was reconciled at
`63ce9a2` and said `remote=none`). Both are rewritten in this landing — ledger row 24.

**Version rule (owner):** the visible version rises by **0.01 on every push**.
Before the next push: `pnpm release --title "…" --note "…"` (writes
`src/data/version.json` and `package.json`), then commit, gate, push.
**Next version is 1.04.**

`origin` is `https://github.com/ArndRosemeier/Weather` (public, MIT). Live at
`https://apps.futuremagic.de/weather/`, but the deployed build lags HEAD until a
separate publish run — deploying is outside this session's remit. Every commit that
reaches `main` is pushed only after its own full gate; `git ls-remote origin
refs/heads/main` is the authority for the current sha.

## What exists

- **Data core** (`src/lib/`): 11 models, one per base model, 18 documented
  exclusions; boundary-validated client; null-aware hourly/daily aggregation; units;
  WMO → label/icon/hero; 20-minute cache; persisted settings; always fetches the
  16-day maximum so coverage describes the model, not the selected view.
- **UI** (`src/App.tsx`, `src/components/`): hero with generated art, stats, hourly
  SVG chart (average + per-model + spread band + tooltip/keyboard, day borders and
  staggered day rail, coverage per legend chip), daily strip with 7 / 10 / 16-day
  view, model picker (physics/AI, availability, horizon), provider tooltips,
  model-by-model table, location sheet, version badge + What's-new history, PWA shell
  and service worker.
- **Resume refresh** (`src/lib/resume.ts`): one debounced trigger fires on
  `visibilitychange` (visible), `pageshow` with `persisted` (bfcache) and `online`
  (reconnect); duplicate events collapse to one refetch.
- **Tests**: 47 unit (`pnpm test:unit`), 19 E2E passed + 1 opt-in live
  (`pnpm test:e2e`, `LIVE=1`). Playwright drives system Chrome against recorded
  fixtures — including a real capture with three models offline.
- **Docs**: `README.md`, `docs/ARCHITECTURE.md` (seam index + data contract),
  `docs/TESTING.md`, `docs/DECISION-LEDGER.md` (rows 1–24), this file, board.

## How to run

```bash
pnpm install
pnpm dev                      # http://localhost:5173/weather/
pnpm build && pnpm preview    # http://localhost:4173/weather/
bash scripts/gate.sh          # build + unit + Playwright; exit 0 green
```

## What is next

Nothing is owed. If a successor picks this up:

1. Re-run `bash scripts/gate.sh` before changing anything (exit 9 = lock busy).
2. **Unverified:** real iOS/Android standalone-PWA resume. The events are emulated
   in Playwright; a device check (background the app, reopen, watch `Updated`) is
   still owed. The same applies to the live sub-path until it is republished.
3. Horizon reference, measured 2026-10-19: IFS 15.0 d, GFS 16.0 d, JMA 11.3 d,
   GEM 10.0 d, ICON 7.5 d, UKMO 7.0 d, ARPEGE 4.5 d, CMA 5.4 d; AIFS/GraphCast/BOM
   were offline. Only IFS and GFS reliably exceed a week.
4. Deliberate non-goals: no backend, no accounts, no deployment. MIT licensed.

## Traps already known

- Open-Meteo returns **nulls past a model's horizon**; never render them as 0.
- AIFS / GraphCast / BOM intermittently return all-null; that is a visible
  `unavailable` state, not an error.
- Multi-model variables are **suffixed**; single-model responses are not.
- Coverage is measured against the **16-day fetch**, not the selected view; changing
  7 / 10 / 16 must not refetch (an E2E counts requests).
- A phone resume fires several events at once; route them through **one debounced
  trigger** (`src/lib/resume.ts`), never fetch from each handler.
- A wide child (the comparison table) can expand the mobile **layout viewport**
  without changing `scrollWidth`; `min-width: 0` is load-bearing.
- The full E2E command must end with `code=$?; exit $code` or its failure is masked.

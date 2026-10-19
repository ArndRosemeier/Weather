# Testing — what proves this

Two tiers, one gate. `bash scripts/gate.sh`.

| Tier | Command | Question | Exit |
| --- | --- | --- | --- |
| Cheap | `GATE_TESTS=0 bash scripts/gate.sh` → `pnpm run build` | does it typecheck and build? | `0`/`1`/`2` |
| Full | `bash scripts/gate.sh` → `pnpm run test:unit` + `pnpm run test:e2e` | did behaviour move? | `0`/`1`/`9` |

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
| E2E | `tests/e2e/*.spec.ts` | real UI at 390 px and 1440 px against recorded fixtures (deterministic, no live API) |
| Live | `tests/e2e/live.spec.ts` (`LIVE=1`) | the real Open-Meteo contract still holds; run manually, record the numbers |

## Fixtures

`tests/fixtures/berlin-7d.json` is a **real captured response** (2026-10-19) for 11
models, 7 days, all variables. Three models were genuinely unavailable at capture
time — that is used deliberately to test the unavailable state. `berlin-7d-all.json`
is derived from it with deterministic perturbations so every-model aggregates can be
tested; the transformation is in `tests/fixtures/derive-all.mjs`.

E2E intercepts `**/v1/forecast**` and `**/v1/search**`; no test depends on the live
service except the opt-in live spec.

## Image artefacts (heroes + icons)

There is no automated image test yet — no UI, so no screenshot layer. The art check is a
deterministic command plus a human judgement, and both are part of landing an art change:

- **Count and geometry** (one-off `node -e` with sharp metadata): `public/heroes/*.webp`
  = 42 (14 `HeroKey`s × 1600/800/320); every `-1600` is 1600×1067, `-800` 800×533, `-320`
  320×213 — the 3:2 centre crop, never letterboxed.
- **Icons** (sharp metadata): `public/icon-192.png` 192×192, `public/icon-512.png`
  512×512, `public/apple-touch-icon.png` 180×180.
- **Bytes:** every `-1600` should land in 60–500 KB. Measured 2026-10-19: 12/14 in range;
  `clear-day` 41 KB and `overcast` 39 KB are deliberately smooth, low-frequency skies.
  A q88 re-encode was measured at +60% bytes with no visible or measurable gain (170 vs
  173 distinct levels in a 3× crop), so the bound is a *degenerate-output alarm*, not a
  quality target: flag a file only when it is under the floor **and** inspection shows
  blur, banding or a flat fill.
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

The images are not type-checked and no test reads them: the cheap gate passing says
nothing about the hero set, so this section is the check.

## Evidence rules

- Keep raw gate logs in `.gate-logs/` (gitignored).
- E2E writes screenshots for the dispatcher's own review to `artifacts/` — inspect
  them; a passing assertion is not a visual check.
- A screenshot with a layout defect outranks a green assertion.

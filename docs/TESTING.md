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
| Unit | `tests/unit/wmo.test.ts` | code mapping, day/night, unknown-code honesty, hero completeness |
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

## Evidence rules

- Keep raw gate logs in `.gate-logs/` (gitignored).
- E2E writes screenshots for the dispatcher's own review to `artifacts/` — inspect
  them; a passing assertion is not a visual check.
- A screenshot with a layout defect outranks a green assertion.

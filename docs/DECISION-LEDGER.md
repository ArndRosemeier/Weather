# The decision ledger

**Append-only.** A decision is history; history never rots. Never edit another
landing's row — if a decision is superseded, add a new row that says so and points
at the old one. Behaviour lives in a test; this file holds the decision, the reason,
and the pointer.

## Ledger

| n | statement | files | why | status |
| ---: | --- | --- | --- | --- |
| 1 | **Open-Meteo is the single data source.** Owner: *"First research where to get free weather data for an open source project."* Evidence (2026-10-19): `api.open-meteo.com` answers in ~0.1 s with `access-control-allow-origin: *`; free tier is non-commercial only, CC-BY 4.0, 10k calls/day, 5k/hour, 600/min. Rejected: direct GRIB from NOAA NCEP / DWD / ECMWF Open Data — no CORS, needs a backend and a GRIB decoder. Unproven: that any future deployment stays non-commercial. | `src/lib/api.ts` | one API, one parser, one attribution story | LANDED |
| 2 | **One selectable model per BASE model, never per provider.** Owner: *"There are not many global weather models, so part of the research is to make sure that no base model is reported more than once. Different provider does not equal different base model."* Evidence: Open-Meteo offers ECMWF IFS three times and "seamless" blends that only add regional domains; registry + test enforce one entry per base. Rejected: listing every Open-Meteo model (IFS 3×, ICON-EU as a "second opinion"). Unproven: whether a future provider redistributes an existing base under a new id. | `src/lib/models.ts`, `tests/unit/models.test.ts` | comparison must compare models, not vendor wrappers | LANDED |
| 3 | **Static SPA, browser-direct, no backend.** Evidence: CORS `*` on forecast and geocoding; per-IP limits make a proxy pointless for a single-user app. Rejected: server proxy (second process, secrets, no benefit). Unproven: shared-IP limits on public Wi-Fi; mitigated by a 20-min cache and one retry. | `src/lib/api.ts`, `public/` | simpler, testable, deployable as static files | LANDED |
| 4 | **The average is a null-aware mean with a visible spread band.** Rejected: inverse-error weighting (no honest per-model skill data) and dropping disagreeing models (hides the interesting part). Unproven: whether a median resists outliers better; mean chosen for explainability. | `src/lib/average.ts` | an average must stay explainable and must not invent data | LANDED |
| 5 | **Cinematic photographic sky art, generated with Meta Muse.** Owner chose *"Cinematic photographic skies"*. Evidence (2026-10-19): `meta/muse-image`, aspect 3:2, resolution 2K — 14 of 14 families generated on the first attempt, **0 regenerations**; raws are 1920×1280 WebP in `assets/raw-heroes/` (gitignored; the provider returns WebP whatever the `.png` output path says). Shipped as 14 keys × {1600, 800, 320} WebP = **42 files, 2,044,774 B** (1600 set alone 1.44 MB); icons rendered from `public/icon.svg` at 192/512/180. Spend: `or key` 0.288504762 → 0.428504762 (14 × $0.01; a reading taken the instant the script exited showed 0.408504762, before the last two charges had posted). Every 1600 px frame was opened and judged against the bar (no text/letters/watermark/logo, no people, subject matches its key, photographic not cartoon, calm lower third, no near-duplicates): **pass on all 14**, per-key notes and sizes in *Row 5 evidence — hero art* below. The 60 KB floor for a 1600 px file is missed by two deliberate smooth skies (`clear-day` 41 KB, `overcast` 39 KB); q88 was measured to add ~60% bytes for no gain (170 vs 173 distinct levels in a 3× crop, visually identical), so encoding stays q80. Rejected: painterly illustration and 3D isometric — both compete with dense data. Unproven: how it reads on a low-brightness phone; screenshots are the check. | `scripts/generate-heroes.mjs`, `public/heroes/`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` | one coherent art system across every condition | LANDED 66cbfb6 |
| 6 | **AI models are included and labelled.** Owner chose *"Include them, clearly labelled AI"*. Evidence: AIFS and GraphCast are distinct architectures, not re-reports; both were intermittently offline at capture, which the unavailable state must handle. Rejected: physics-only (less interesting, hides a real comparison). | `src/lib/models.ts` | modern comparison value, honest labels | LANDED |
| 7 | **Nothing is pushed or deployed.** Owner: *"Do not push anything yourself"*, confirmed *"Local only, no remote, no deploy"*. Evidence: no git remote exists; no deploy scripts. | repo | the owner decides what leaves the machine | LANDED |
| 8 | **Default window 7 days, with each model's real horizon visible.** Evidence: measured horizons range from 4.6 d (ARPEGE) to 16 d (GFS); the API returns nulls past a horizon. Rejected: clipping all models to the shortest (4.6 d) — throws away most of the forecast. Unproven: whether 16 days is wanted; the selector offers 3/7/10/16. | `src/lib/api.ts`, UI | honest comparison across unequal models | LANDED |
| 9 | **Unavailable is a visible state.** Evidence: AIFS/GraphCast/BOM returned all-null on live capture while others had data; a 16-day window returned all-null for models that work at 7 days. Rejected: hiding unavailable models (user cannot tell quiet from broken). | `src/lib/api.ts`, model picker | the user must know why a model is missing | LANDED |

## Row 5 evidence — hero art

Generated 2026-10-19 by `scripts/generate-heroes.mjs` with `meta/muse-image` (3:2, 2K,
shared `STYLE` suffix unchanged). Raws are 1920×1280 WebP in `assets/raw-heroes/`
(gitignored). The script **skips a raw that already exists**, so a per-key regeneration is:
delete `assets/raw-heroes/<key>.webp` **and** `public/heroes/<key>-{1600,800,320}.webp`,
rerun, and the other 13 keys are untouched. Policy: at most two attempts per key. No key
needed a second attempt — all 14 passed on the first render.

| key | prompt subject | what came back (lower-third verdict) | 1600 px |
| --- | --- | --- | ---: |
| `clear-day` | deep-blue summer sky, high sun, wispy cirrus, lens flare, soft distant horizon | blue gradient with cirrus sweep and a ring flare over a sunlit plain; calmest lower third in the set (Laplacian 2.7), no banding | 41 KB |
| `clear-night` | star-filled sky, Milky Way over a dark horizon, indigo with faint airglow | Milky Way arch with dust lanes and green airglow above a lake and dark ridge; no light pollution | 161 KB |
| `partly-cloudy-day` | towering white cumulus on vivid blue, sunbeams through the cloud edges | backlit cumulus towers with crepuscular rays over a plain; broad calm foreground | 94 KB |
| `partly-cloudy-night` | moonlit silver clouds across deep indigo, rim light on cloud tops | layered moonlit bands over black water, glow behind the deck; sits exactly at the 60 KB floor | 60 KB |
| `overcast` | layered grey stratocumulus deck, soft diffuse light, quiet and minimal | uniform textured deck over still water, no focal point; the flattest file in the set (39 KB) | 39 KB |
| `fog` | dense morning fog over a forested valley at dawn, pale gold light | layered mist between conifer ridges above a lake, dawn light from the left | 97 KB |
| `drizzle` | fine drizzle on a wet city street at dusk, glistening pavement, soft bokeh | blurred street with lamp bokeh and glossy asphalt, no signage; busiest lower third (15.3) — needs the UI text scrim | 116 KB |
| `rain` | steady rain over rooftops and a distant skyline, visible rain streaks | wet roofs and rain streaks toward a hazy skyline; lower third 14.9 — needs the scrim | 143 KB |
| `heavy-rain` | torrential downpour beneath a towering dark storm cloud, sheets of rain | stacked dark towers with visible rain curtains over wetland; horizon low in frame | 101 KB |
| `thunderstorm` | lightning bolt splitting a purple-black sky over open plains, lit cloud towers | single forked bolt, purple cast, clean dark plain in the lower third | 81 KB |
| `snow` | heavy snowfall over a pine forest and a small alpine village, calm | snowy chalets and snow-laden spruces with falling flakes over a clean snow slope; no signs or people | 173 KB |
| `wind` | wind sweeping long grass across coastal dunes under streaking clouds, low sun | motion-streaked dune grass and cloud streaks at sunset; smooth sand foreground | 147 KB |
| `heat` | shimmering heat haze over a sunbaked desert, bleached sky, intense white sun | dune ridges dissolving into haze under a near-white sky; calmest top third (0.8) | 64 KB |
| `frost` | hoarfrost crystals on branches in a cold blue dawn, pale pink light | crystal-coated shrub against a pink-blue dawn and a frosted meadow | 121 KB |

**Verification at landing** (`slice/heroes`, base `63ce9a2`): `pnpm test:unit` **28 passed**
(6 files); `pnpm run typecheck` exit **0**; `GATE_TESTS=0 bash scripts/gate.sh` exit **1**
(RED) — not the `2` a cheap-only run reports when the build passes, and not caused by this
row: `vite build` cannot resolve `/src/main.tsx`, which is absent at `63ce9a2` *and* at
`main` (`b721829`), so the cheap tier cannot pass before the UI row lands. Raw log:
`/home/administrator/projects/Weather/.gate-logs/gate.log`. **Gap found, not fixed in this
landing:** nothing in the unit suite pins the 14 `HeroKey`s to the 42 files; `AGENTS.md`
rule 5 and `TESTING.md` said a unit test proves hero completeness — it does not, the check
is the manual artefact/visual pass described in `TESTING.md`. Also `heroFor` can never
return `wind`: no WMO code maps to it, so the asset is generated but unreachable until the
UI row decides on a wind-speed rule.

# Weather Compare — agent/workspace rules

A TypeScript/React comparative weather app: independent global forecast models side
by side, plus a null-aware average across the models the user selects. One static
SPA, no backend, data from the Open-Meteo free API (non-commercial, CC-BY 4.0).

Start with [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the seam index. Then the
board ([`docs/BOARD.md`](docs/BOARD.md)) for what is happening now and
[`docs/DECISION-LEDGER.md`](docs/DECISION-LEDGER.md) for why it is like this.

The process (roles, board, verification doctrine, brief template) is the shared
Toolbox `WAY-OF-WORKING.md`; this file holds only what is binding here.

## Cross-tool contract

This project is worked from DSH and Claude Code. The contract is
[`docs/CROSS-TOOL.md`](docs/CROSS-TOOL.md).

- **Start:** read `HANDOFF.md`, run `node scripts/cos.mjs status --one-line`, and
  reconcile against git, the worktrees and the gate lock before dispatching.
- **There is no git remote, by owner decision.** Reconcile against local `main`;
  never invent a push step. "Do not push anything yourself" is standing.
- **One gate:** `bash scripts/gate.sh` (exit `0` green · `1` red · `2` cheap only ·
  `9` refused/void). It journals every run to `.cos/journal.jsonl`.
- **Procedures:** `.claude/commands/*.md`; **roles:** `.claude/agents/*.md`.

## Binding engineering rules

1. **No silent fallbacks.** Data, parsing or a fetch that fails surfaces loudly
   through the app's one error banner. Never render missing data as `0`.
2. **Validate at every boundary.** The Open-Meteo response is checked structurally;
   a malformed payload throws, it never becomes empty data. A model that is *present
   but has no values* is a legitimate, visible `unavailable` state — not an error.
3. **ONE model per base model.** `src/lib/models.ts` is the single seam. Every
   selectable model carries a `baseModel`; every excluded Open-Meteo variant is in
   `SUPERSEDED` with the concrete reason. Adding a model without a base model fails
   `assertNoDuplicateBaseModels` and the unit test.
4. **One error surface.** Failures go to `src/components/ErrorBanner.tsx` via
   `App`'s error state; no component renders a private error string.
5. **Hero art is generated, never stock.** `scripts/generate-heroes.mjs` holds the
   prompts and the Meta Muse model id. New condition families get a prompt there and
   a `HeroKey` in `src/lib/wmo.ts`; the unit test proves the mapping is complete.
6. **Centralize.** When one idea lands in two places, fold it into one seam and say
   `COPIES: n→1 — <seam>` in the landing. A brief without that line is incomplete.

## Commands

```bash
pnpm dev                 # Vite dev server
pnpm build               # typecheck + production build (cheap gate tier)
pnpm test:unit           # Vitest
pnpm test:e2e            # Playwright against the preview build
pnpm test:all            # unit + e2e (full gate tier)
bash scripts/gate.sh     # THE gate
pnpm heroes              # regenerate hero art (or image, Meta Muse)
```

## Standing rules

- **Do not push, publish or deploy.** No remote, no static-host upload.
- **Never run a long check in the foreground of the dispatcher session.** Use a
  background job and wait for the notice; a writer runs its checks in-turn.
- **A writer works only in its own worktree with ABSOLUTE paths.** At most two
  writers in flight.
- **Reap what you start:** a headless browser is a process tree; kill it in a `trap`,
  by PID captured in a separate call, and verify `ps -eo comm= | grep -c '^chrome$'`
  is `0`.

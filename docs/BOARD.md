# The board — what is happening right now

**This file is the state of record.** It is true *before* any report reaches the
owner. A successor acts from this file plus `git log --oneline -10`,
`git ls-remote origin refs/heads/main` and `git worktree list`.

**One screen, overwritten in place.** Verified landings are in the decision ledger
and the gate journal; this file carries the present.

## Board

```
reconciled: origin/main @ fd79401 · local record ahead · 2026-10-27T09:22+01:00

SESSION | id=session-1afeb651 | model=deepseek-flash | state=complete
VERSION | 1.04 prepared (src/data/version.json) | NEXT-PUSH 1.05 after this one

GATE | tier=full | sha=0001983 | exit=0 | unit=47/47 (12 files) | e2e=19 passed, 1 skipped (opt-in live) | duration=41s | lock=acquired | log=.gate-logs/gate-resume.log
GATE | tier=full | sha=4a496e9 | exit=0 | same suite | duration=35s | lock=acquired | log=.gate-logs/gate-record-repair.log

LANDED | row=23 | sha=0001983 | verify=MY OWN: gate above + resume E2E (visibility, bfcache, reconnect) + unit debounce | resumed PWA refetches instead of showing last session's state | docs=ledger row 23
RECORD-FIX | row=24 | HANDOFF and BOARD had drifted (30/11 counts, rows 1–11, "no license", reconciled 63ce9a2, remote=none); both rewritten at 0001983 | docs=ledger row 24

PUSH | origin=https://github.com/ArndRosemeier/Weather (public, MIT) | transport=SSH via the host's global `url.insteadOf` rewrite; remotes unchanged; no tokens or credential helpers | `ssh -T git@github.com` → "Hi ArndRosemeier!" | `git ls-remote origin` exit 0 | every pushed commit gated first
PUSHED | 2026-10-27T09:22+01:00 | 7d119dc..fd79401 | push exit 0 | local == remote fd79401 | version 1.03 | transport=SSH (url.insteadOf) | no token/helper
PUSH-DOC | row=27 | docs/PUSHING.md | SSH push procedure persisted for every agent; linked from AGENTS.md and HANDOFF.md | pushed with version 1.04 after the gate
LIVE | https://apps.futuremagic.de/weather/ (200) | lags HEAD until a separate publish run; deploying is outside this session's remit

RECOVERY | repo=/home/administrator/projects/Weather | remote=https://github.com/ArndRosemeier/Weather | branch=main | gate=bash scripts/gate.sh
```

## Guards

- **Gate lock:** `.gate-lock/` at the repo root, derived from the git common dir; one
  expensive run at a time. Exit `9` is a refusal, not a failure.
- **Version:** `pnpm release --title … --note …` is the only writer; +0.01 per push.
- **Browsers:** Playwright drives system Chrome; every run must end with
  `ps -eo comm= | grep -c '^chrome$'` = `0`.

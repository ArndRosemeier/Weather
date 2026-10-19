# The board — what is happening right now

**This file is the state of record.** It is true *before* any report reaches the
owner. A successor acts from this file plus `git log --oneline -10` and
`git worktree list`. There is no remote by owner decision, so local `main` is the
reference branch.

**One screen, overwritten in place.** Every record names something checkable — sha,
branch, worktree, session id, path.

## Board

```
reconciled: main @ 63ce9a2 · 2026-10-19T14:31Z

SESSION | id=session-1afeb651 | model=deepseek-flash | state=dispatching

IN-FLIGHT | row=5 | session=heroes-writer | worktree=/home/administrator/projects/Weather/worktrees/heroes | branch=slice/heroes | base=63ce9a2 | state=dispatched | scope=14 hero families + app icons, WebP 320/800/1600, docs row 5
QUEUE | row=10 | UI shell: hero, model picker, hourly chart, daily strip, comparison | src=this file
QUEUE | row=11 | Playwright E2E at 390/1440 + fixtures + offline | src=docs/TESTING.md
QUEUE | row=12 | PWA polish, a11y, screenshots for dispatcher review | src=docs/ARCHITECTURE.md
QUEUE | row=13 | HANDOFF + final gate + report | src=this file

RECOVERY | repo=/home/administrator/projects/Weather | remote=none (owner rule) | branch=main | gate=bash scripts/gate.sh
```

## Records

(empty — the first landing will add a `LANDED` line)

## Guards

- **Gate lock:** `.gate-lock/` at the repo root, derived from the git common dir; one
  expensive run at a time. Exit `9` is a refusal, not a failure.
- **Spend:** hero generation uses the host creative OpenRouter key; `or key` shows
  usage before and after.
- **Browsers:** Playwright drives system Chrome; every run must end with
  `ps -eo comm= | grep -c '^chrome$'` = `0`.

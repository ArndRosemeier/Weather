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

SESSION | id=session-1afeb651 | model=deepseek-flash | state=complete

LANDED | row=5 | sha=66cbfb6 (merge e8a620f) | verify=MY OWN: 42 WebP + icons read with image inspection, 30/30 unit incl. hero-asset contract | worktree /home/administrator/projects/Weather/worktrees/heroes removed, session retired | docs=ledger row 5 + appendix, architecture, testing
LANDED | row=10 | sha=3cefa9f | verify=MY OWN: build 0, unit 30/30, 11 E2E passed/1 skipped | docs=ledger row 10
LANDED | row=11 | sha=7494314 + 909d490 | verify=MY OWN: mobile layout viewport pinned, tooltip unclipped, hero remount | docs=ledger rows 11-12

GATE | tier=full | sha=909d490 | exit=0 | unit=30/30 (7 files) | e2e=11 passed, 1 skipped (opt-in live) | duration=27s | lock=acquired | log=.gate-logs/gate-full-909d490.log
GATE | tier=cheap | sha=9c2965b | exit=2 | build green, SUITE DID NOT RUN by design — delta 909d490..9c2965b is four docs files (verified with git diff --name-only) | duration=2s | lock=none | log=.gate-logs/gate-cheap-9c2965b.log
GATE | tier=full | sha=db014a0 | exit=0 | unit=30/30 (7 files) | e2e=11 passed, 1 skipped (opt-in live) | duration=25s | lock=acquired | log=.gate-logs/final-gate-db014a0.log
GATE | tier=full | sha=7ce191e | exit=0 | unit=35/35 (8 files) | e2e=12 passed, 1 skipped (opt-in live) | duration=27s | lock=acquired | log=.gate-logs/gate-7ce191e.log

LANDED | row=15 | sha=7ce191e | verify=MY OWN: LICENSE + package.json + README; full gate above | MIT license per owner instruction | docs=ledger row 15
LANDED | row=16 | sha=7ce191e | verify=MY OWN: 7-day and 48h chart screenshots inspected (desktop + 390px), unit 35/35, E2E 12/12 | day borders + day rail; true 168h window; zero-step loop caught pre-ship | docs=ledger row 16
NOTE | exit 2 is not "the gate passed": behaviour evidence for this tree is the full run on 909d490; the code tree is identical, only prose changed.

PUSH | origin=https://github.com/ArndRosemeier/Weather (public, default=main) | initial push db014a0 verified MATCH (git ls-remote == local HEAD) | rule: every record commit is pushed only after its own full gate; current sha = `git ls-remote origin refs/heads/main` | owner instruction 2026-10-19: "Please push to here" — supersedes ledger row 7 for this repo only | no deploy, no force-push

retired_branch=slice/heroes
QUEUE-CLOSED | row=12 | full gate on final commit — recorded above

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

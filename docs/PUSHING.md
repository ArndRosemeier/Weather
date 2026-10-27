# Pushing — for any agent on this host

**Read this before pushing. Do not improvise a token.**

## Transport

GitHub pushes from this box use **SSH**, set up globally by the owner:

- `https://github.com/...` URLs are rewritten to SSH by `url.insteadOf` in
  `~/.gitconfig`; the configured remote in this repo stays
  `https://github.com/ArndRosemeier/Weather.git` and is rewritten on use.
  **Leave the remotes as they are.**
- Verify access with:

  ```bash
  ssh -T git@github.com
  ```

  Expected: `Hi ArndRosemeier! You've successfully authenticated…` (exit code `1` is
  GitHub's normal reply — it does not provide shell access).

- **Never** add a token or credential helper for `github.com`. **Never** put a
  GitHub token in `~/.git-credentials` — that file also holds a local OpenClaw
  credential, and overwriting it breaks another platform. **Never** edit
  `~/.ssh/config` or the global git config. Do not use `gh auth` for github.com.

## Before a push

1. The owner asked for the push. (No push without an explicit instruction; never
   force-push `main`.)
2. `bash scripts/gate.sh` is **green** on the exact commit to be pushed. Exit `0`
   only; `2` means the suite did not run and is not a pass.
3. The visible version is bumped: `pnpm release --title "…" --note "…"` — **+0.01 on
   every push** (writes `src/data/version.json` and `package.json`).

## Push and prove it

```bash
git push origin HEAD:main
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

The two SHAs must be **equal**; quote them. A push is not verified by the absence of
an error message.

## If it fails

Report the **exact** error (command, exit code, remote message) to the owner. Do not
work around it with tokens, credential helpers, `--force`, or config changes. A
pre-SSH `403 Permission … denied` belongs to the withdrawn token path and is not a
reason to reintroduce it.

## Out of scope for a push

Deploying or publishing to a host (for example `apps.futuremagic.de/weather/`) is a
separate operation and is not performed by this push. The live site lags `main`
until someone publishes it.

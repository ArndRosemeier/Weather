/**
 * Debounced "the app is on screen again" trigger.
 *
 * Mobile PWAs are commonly resumed rather than reloaded: the page comes back from
 * the background or from the back/forward cache with the data it had when it was
 * last looked at. Visibility changes and bfcache restores both arrive here; the
 * debounce keeps a single resume from firing two fetches (visibilitychange +
 * pageshow) while still allowing a genuine second resume a moment later.
 */
export interface ResumeOptions {
  minGapMs?: number
  now?: () => number
}

export function createResumeRefresh(refresh: () => void, options: ResumeOptions = {}): () => boolean {
  const minGapMs = options.minGapMs ?? 1500
  const now = options.now ?? (() => (typeof performance === 'undefined' ? Date.now() : performance.now()))
  let last = Number.NEGATIVE_INFINITY

  return () => {
    const at = now()
    if (at - last < minGapMs) return false
    last = at
    refresh()
    return true
  }
}

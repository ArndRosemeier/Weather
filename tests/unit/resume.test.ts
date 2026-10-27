import { describe, expect, it } from 'vitest'
import { createResumeRefresh } from '../../src/lib/resume'

describe('resume refresh', () => {
  it('fires once for a resume even when two events arrive together', () => {
    let clock = 0
    let calls = 0
    const trigger = createResumeRefresh(() => { calls += 1 }, { now: () => clock })

    expect(trigger()).toBe(true)
    clock = 400
    expect(trigger()).toBe(false)
    expect(calls).toBe(1)
  })

  it('lets a genuine second resume through after the gap', () => {
    let clock = 0
    let calls = 0
    const trigger = createResumeRefresh(() => { calls += 1 }, { now: () => clock })

    trigger()
    clock = 1499
    trigger()
    expect(calls).toBe(1)
    clock = 1500
    expect(trigger()).toBe(true)
    expect(calls).toBe(2)
  })
})

import { useEffect, useRef } from 'react'
import { VERSION, VERSION_HISTORY } from '../lib/version'
import { UiIcon } from './UiIcon'

interface Props {
  open: boolean
  onClose: () => void
}

export function WhatsNew({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet sheet--history"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__head">
          <div>
            <h2 id="whats-new-title">What&apos;s new</h2>
            <p className="sheet__sub">Version {VERSION} · the number rises by 0.01 with every push</p>
          </div>
          <button ref={closeRef} type="button" className="icon-button" onClick={onClose} aria-label="Close What's new">
            <UiIcon name="close" size={18} />
          </button>
        </div>

        <ol className="history">
          {VERSION_HISTORY.map((entry, index) => (
            <li key={entry.version} className={`history__entry ${index === 0 ? 'is-current' : ''}`}>
              <div className="history__head">
                <span className="history__version">v{entry.version}</span>
                <time className="history__date" dateTime={entry.date}>
                  {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    timeZone: 'UTC',
                  })}
                </time>
                {index === 0 && <span className="history__tag">current</span>}
              </div>
              <h3 className="history__title">{entry.title}</h3>
              <ul className="history__changes">
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

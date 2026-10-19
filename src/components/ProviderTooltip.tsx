import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { modelsForProvider, providerFor } from '../lib/providers'

interface Props {
  providerId: string
  className?: string
}

/**
 * The provider name as an information trigger. Opens on hover and on keyboard
 * focus, closes on Escape, scroll or when focus/pointer leaves. Rendered in a
 * portal with fixed positioning so the model table's horizontal scroll container
 * cannot clip it.
 */
export function ProviderTooltip({ providerId, className }: Props) {
  const info = providerFor(providerId)
  const models = modelsForProvider(providerId)
  const tooltipId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0, above: false })

  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  const show = () => {
    cancelClose()
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(300, window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    const above = rect.bottom + 260 > window.innerHeight
    setPosition({ left, top: above ? rect.top - 8 : rect.bottom + 8, above })
    setOpen(true)
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onViewportChange = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [open])

  useEffect(() => () => cancelClose(), [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`provider-trigger ${className ?? ''}`}
        data-testid="provider-trigger"
        data-provider-id={providerId}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`About ${info.name}`}
        onMouseEnter={show}
        onMouseLeave={scheduleClose}
        onFocus={show}
        onBlur={scheduleClose}
        onClick={(event) => event.stopPropagation()}
      >
        {info.name}
      </button>

      {open &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={`provider-tip ${position.above ? 'provider-tip--above' : ''}`}
            style={{ left: position.left, top: position.top }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onFocus={cancelClose}
            onBlur={scheduleClose}
          >
            <p className="provider-tip__name">{info.fullName}</p>
            <p className="provider-tip__where">{info.where}</p>
            <p className="provider-tip__desc">{info.description}</p>
            <p className="provider-tip__models">
              Models here: {models.map((model) => model.name).join(', ')}
            </p>
            <a className="provider-tip__link" href={info.url} target="_blank" rel="noreferrer noopener">
              Official site ↗
            </a>
          </div>,
          document.body,
        )}
    </>
  )
}

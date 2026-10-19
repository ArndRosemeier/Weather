import { UiIcon } from './UiIcon'

export function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div className="banner banner--error" role="alert">
      <UiIcon name="info" size={18} />
      <div className="banner__body">
        <strong className="banner__title">Could not update the forecast</strong>
        <span className="banner__text">{message}</span>
      </div>
      <div className="banner__actions">
        {onRetry && (
          <button type="button" className="button button--small" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button type="button" className="button button--ghost button--small" onClick={onDismiss} aria-label="Dismiss error">
            <UiIcon name="close" size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="banner banner--notice" role="status">
      <UiIcon name="info" size={16} />
      <span className="banner__text">{children}</span>
    </div>
  )
}

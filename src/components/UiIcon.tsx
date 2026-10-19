type Name = 'search' | 'location' | 'refresh' | 'check' | 'chevron' | 'close' | 'info' | 'sliders'

const PATHS: Record<Name, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 20 20" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s6.5-5.4 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.8V17M12 7.4h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
}

export function UiIcon({ name, size = 18, className }: { name: Name; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}

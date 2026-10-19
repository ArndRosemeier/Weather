import type { IconKey } from '../lib/wmo'

interface Props {
  icon: IconKey
  size?: number
  className?: string
}

const PATHS: Record<IconKey, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </>
  ),
  moon: <path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8 8.4 8.4 0 1 0 20.2 14.4Z" />,
  'cloud-sun': (
    <>
      <path d="M8.6 3.6v1.8M4.2 8.1h1.8M5.6 5.1l1.3 1.3" />
      <circle cx="8.6" cy="8.1" r="2.6" />
      <path d="M7 18.8h9.8a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 18.8Z" />
    </>
  ),
  'cloud-moon': (
    <>
      <path d="M15.7 4.4a4.6 4.6 0 0 0 5.1 6.4" />
      <path d="M7 18.8h9.8a3.6 3.6 0 0 0 .4-7.2 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 18.8Z" />
    </>
  ),
  cloud: <path d="M6.4 18.6h11a4 4 0 0 0 .4-8 5.4 5.4 0 0 0-10.4 1.2 3.4 3.4 0 0 0-1 6.8Z" />,
  fog: (
    <>
      <path d="M5 9.6h14M7 13h10M4 16.4h16M6 19.8h12" />
    </>
  ),
  drizzle: (
    <>
      <path d="M6.6 15h10.8a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10 1.1A3.2 3.2 0 0 0 6.6 15Z" />
      <path d="M9 18.2l-.8 2M13 18.2l-.8 2M17 18.2l-.8 2" />
    </>
  ),
  rain: (
    <>
      <path d="M6.6 15h10.8a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10 1.1A3.2 3.2 0 0 0 6.6 15Z" />
      <path d="M8.6 17.8l-1.4 3M13 17.8l-1.4 3M17.4 17.8l-1.4 3" />
    </>
  ),
  showers: (
    <>
      <path d="M6.6 14.6h10.8a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10 1.1A3.2 3.2 0 0 0 6.6 14.6Z" />
      <path d="M8.8 17.4l-1.2 2.6M13 17.4l-1.2 2.6M17.2 17.4l-1.2 2.6M12 1.8v2" />
    </>
  ),
  snow: (
    <>
      <path d="M6.6 15h10.8a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10 1.1A3.2 3.2 0 0 0 6.6 15Z" />
      <path d="M8.4 17.6h.01M8.4 21h.01M12.4 19.3h.01M12.4 22.4h.01M16.4 17.6h.01M16.4 21h.01" strokeWidth="2.4" />
    </>
  ),
  thunder: (
    <>
      <path d="M6.6 14.6h10.8a3.6 3.6 0 0 0 .4-7.2 5.2 5.2 0 0 0-10 1.1A3.2 3.2 0 0 0 6.6 14.6Z" />
      <path d="M12.8 15.8l-2.6 4h3l-1.4 3.4 3.4-4.6h-3l1.6-2.8Z" />
    </>
  ),
  unknown: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4M12 17.4h.01" />
    </>
  ),
}

export function WeatherIcon({ icon, size = 24, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[icon]}
    </svg>
  )
}

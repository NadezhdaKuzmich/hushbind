import type { ReactNode } from 'react'

const PATHS = {
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  layers: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
    </>
  ),
  pulse: <path d="M2 12h4l3-8 6 16 3-8h4" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3l9.5 17h-19L12 3z" />
      <path d="M12 10v4M12 17.5v.5" />
    </>
  ),
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export interface IconProps {
  /** Which icon to draw. */
  name: IconName
  /** Width and height in px. */
  size?: number
  /** Stroke width; thinner reads better at large sizes. */
  strokeWidth?: number
  /** Extra class for color or spacing. Color follows `currentColor`. */
  className?: string
}

/**
 * Inline stroke icon. Always decorative: the text next to it carries the meaning,
 * so it is hidden from screen readers.
 *
 * @example <Icon name="shield" size={28} />
 */
export function Icon({ name, size = 20, strokeWidth = 2, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

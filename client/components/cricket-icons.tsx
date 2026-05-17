import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

export function CricketBat({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15.5 3.5l5 5-9.5 9.5a2.5 2.5 0 0 1-3.5-3.5L15.5 3.5z" />
      <path d="M7.5 14.5l-3.2 3.2a1.7 1.7 0 0 0 2.4 2.4l3.2-3.2" />
      <path d="M5.6 18.6l-1.8 1.8" />
    </svg>
  )
}

export function CricketBall({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9.5h16.8" />
      <path d="M3.6 14.5h16.8" />
      <path d="M5.5 7.5l1.2 1.2M5.5 16.5l1.2-1.2M18.5 7.5l-1.2 1.2M18.5 16.5l-1.2-1.2" />
    </svg>
  )
}

export function CricketStumps({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 5v15M12 5v15M17 5v15" />
      <path d="M6 5h12" />
      <path d="M9 5l-0.5-2M15 5l0.5-2" />
    </svg>
  )
}

export function CricketHelmet({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 14a8 8 0 0 1 16 0v2H4v-2z" />
      <path d="M4 16h16" />
      <path d="M9 16v3M13 16v3" />
      <path d="M8 8.5c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5" />
    </svg>
  )
}

export function StadiumIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2 14c2-3 6-5 10-5s8 2 10 5" />
      <path d="M2 14c2 3 6 5 10 5s8-2 10-5" />
      <ellipse cx="12" cy="14" rx="4" ry="1.5" />
      <path d="M5 13.2V11M9 12.5V9.5M15 12.5V9.5M19 13.2V11" />
    </svg>
  )
}

export function CoinIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <path d="M3 12v3c0 2.2 4 4 9 4s9-1.8 9-4v-3" />
      <path d="M10 11.5l1.5 1.5L14.5 10" />
    </svg>
  )
}

export function PitchLines({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <rect x="9" y="3" width="6" height="18" rx="0.5" />
      <path d="M9 8h6M9 16h6" />
    </svg>
  )
}

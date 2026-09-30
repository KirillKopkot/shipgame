import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...rest }: IconProps) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function BackIcon(props: IconProps) {
  return (
    <Icon stroke="currentColor" {...props}>
      <path d="M17 5 8 14l9 9" />
    </Icon>
  )
}

export function ChevronIcon(props: IconProps) {
  return (
    <Icon stroke="currentColor" {...props}>
      <path d="m10 5 9 9-9 9" />
    </Icon>
  )
}

export function TargetIcon(props: IconProps) {
  return (
    <Icon stroke="var(--bs-color-green)" {...props}>
      <circle cx="14" cy="14" r="9" />
      <circle cx="14" cy="14" r="3" />
      <path d="M14 1v5M14 22v5M1 14h5M22 14h5" />
    </Icon>
  )
}

export function PeopleIcon(props: IconProps) {
  return (
    <Icon stroke="var(--bs-color-blue)" strokeWidth="2.6" {...props}>
      <circle cx="10" cy="9" r="4" />
      <path d="M2.5 24c0-4.5 3.4-7.5 7.5-7.5s7.5 3 7.5 7.5" />
      <circle cx="20" cy="10" r="3" />
      <path d="M20.5 16.5c3 .3 5 2.6 5 6" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon stroke="var(--bs-color-orange)" strokeWidth="2.6" {...props}>
      <circle cx="14" cy="14" r="4.5" />
      <path d="M14 2.5v3M14 22.5v3M2.5 14h3M22.5 14h3M5.9 5.9l2.1 2.1M20 20l2.1 2.1M5.9 22.1 8 20M20 8l2.1-2.1" />
    </Icon>
  )
}

export function StarIcon(props: IconProps) {
  return (
    <Icon stroke="var(--bs-color-ink)" fill="var(--bs-color-surface)" strokeWidth="2.6" {...props}>
      <path d="m14 3 3.3 6.8 7.4 1-5.4 5.2 1.3 7.4L14 19.8l-6.6 3.6 1.3-7.4-5.4-5.2 7.4-1z" />
    </Icon>
  )
}

/** Small round mascot used as the Salvo logo mark. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        d="M27 12c4-6 9-6 11-4"
        fill="none"
        stroke="var(--bs-color-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="38" cy="8" r="3.5" fill="var(--bs-color-yellow)" stroke="var(--bs-color-ink)" strokeWidth="2" />
      <circle cx="22" cy="27" r="18" fill="var(--bs-color-blue)" stroke="var(--bs-color-ink)" strokeWidth="3" />
      <circle cx="22" cy="27" r="9" fill="#fff" stroke="var(--bs-color-ink)" strokeWidth="2.5" />
      <circle cx="23" cy="27" r="4.5" fill="var(--bs-color-ink)" />
    </svg>
  )
}

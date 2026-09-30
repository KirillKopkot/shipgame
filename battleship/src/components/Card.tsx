import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  selected?: boolean
  disabled?: boolean
  /** When set, the card is a real button (keyboard and touch accessible). */
  onClick?: () => void
  className?: string
}

export function Card({ children, selected, disabled, onClick, className }: CardProps) {
  const classes = [
    'bs-card',
    selected && 'is-selected',
    disabled && 'is-disabled',
    onClick && 'ui-card--action',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    )
  }
  return <div className={classes}>{children}</div>
}

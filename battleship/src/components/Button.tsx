import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'disabled' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the full width of the container (default). */
  block?: boolean
  /** Small pill after the label, e.g. the selected cell in "Fire! D7". */
  meta?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  block = true,
  meta,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = variant === 'disabled' || disabled
  const classes = [
    'bs-btn',
    variant === 'primary' && 'bs-btn--primary',
    variant === 'secondary' && 'bs-btn--secondary',
    variant === 'ghost' && 'bs-btn--ghost',
    size !== 'md' && `bs-btn--${size}`,
    block && 'ui-block',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button {...rest} type={type} className={classes} disabled={isDisabled}>
      {children}
      {meta !== undefined && <span className="bs-btn__meta">{meta}</span>}
    </button>
  )
}

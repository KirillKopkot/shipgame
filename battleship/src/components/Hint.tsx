import type { ReactNode } from 'react'

interface HintProps {
  tone: 'ok' | 'bad'
  children: ReactNode
}

export function Hint({ tone, children }: HintProps) {
  return (
    <div className={`bs-hint bs-hint--${tone}`} role="status">
      <span aria-hidden="true">{tone === 'ok' ? '●' : '✕'}</span>
      <span>{children}</span>
    </div>
  )
}

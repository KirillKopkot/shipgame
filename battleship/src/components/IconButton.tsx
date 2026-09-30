import type { ReactNode } from 'react'

interface IconButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
}

export function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button type="button" className="bs-icon-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

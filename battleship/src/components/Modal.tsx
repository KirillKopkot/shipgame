import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { IconButton } from './IconButton'

interface ModalProps {
  /** Id of the heading element inside `children`, for the dialog name. */
  labelledBy: string
  onClose: () => void
  children: ReactNode
}

function CloseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="m7 7 14 14M21 7 7 21" />
    </svg>
  )
}

/** Dimmed overlay with a card; closes on the cross, a tap on the backdrop or Escape. */
export function Modal({ labelledBy, onClose, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" onClick={onClose}>
      <div
        className="bs-card modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__close">
          <IconButton label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

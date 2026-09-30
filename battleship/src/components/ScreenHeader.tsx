import type { ReactNode } from 'react'
import { BackIcon } from './Icons'
import { IconButton } from './IconButton'

interface ScreenHeaderProps {
  /** Small uppercase label next to the back button. */
  title: string
  onBack: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <header className="ui-topbar">
      <IconButton label="Back" onClick={onBack}>
        <BackIcon />
      </IconButton>
      <span className="bs-eyebrow ui-topbar__title">{title}</span>
      {right && <div className="ui-topbar__right">{right}</div>}
    </header>
  )
}

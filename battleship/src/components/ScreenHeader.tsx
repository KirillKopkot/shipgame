import type { ReactNode } from 'react'
import { BackIcon } from './Icons'
import { IconButton } from './IconButton'

interface ScreenHeaderProps {
  /** Small uppercase label next to the back button. */
  title: string
  /** Larger second line under the title, e.g. "Medium · Turn 15". */
  heading?: string
  onBack: () => void
  right?: ReactNode
}

export function ScreenHeader({ title, heading, onBack, right }: ScreenHeaderProps) {
  return (
    <header className="ui-topbar">
      <IconButton label="Back" onClick={onBack}>
        <BackIcon />
      </IconButton>
      <div className="ui-topbar__title">
        <span className="bs-eyebrow">{title}</span>
        {heading && <p className="bs-h2 ui-topbar__heading">{heading}</p>}
      </div>
      {right && <div className="ui-topbar__right">{right}</div>}
    </header>
  )
}

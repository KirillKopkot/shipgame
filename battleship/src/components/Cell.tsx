export type CellView =
  | 'empty'
  | 'ship'
  | 'hit'
  | 'miss'
  | 'sunk'
  | 'preview-valid'
  | 'preview-invalid'

const CLASS_BY_STATE: Record<CellView, string> = {
  empty: '',
  ship: 'is-ship',
  hit: 'is-hit',
  miss: 'is-miss',
  sunk: 'is-sunk',
  'preview-valid': 'is-valid',
  'preview-invalid': 'is-invalid',
}

interface CellProps {
  state: CellView
  /** Crosshair marker for the currently aimed cell. */
  target?: boolean
  /** Play the appear animation (a fresh shot). */
  isNew?: boolean
  label?: string
  onClick?: () => void
}

export function Cell({ state, target, isNew, label, onClick }: CellProps) {
  const classes = ['bs-cell', CLASS_BY_STATE[state], target && 'is-target', isNew && 'is-new']
    .filter(Boolean)
    .join(' ')

  if (!onClick) return <span className={classes} aria-label={label} />
  return <button type="button" className={classes} aria-label={label} onClick={onClick} />
}

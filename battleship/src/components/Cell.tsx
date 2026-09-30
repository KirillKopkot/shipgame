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
  /** Position on the board, exposed as data attributes for pointer hit-testing. */
  coords?: { x: number; y: number }
  onClick?: () => void
}

export function Cell({ state, target, isNew, label, coords, onClick }: CellProps) {
  const classes = ['bs-cell', CLASS_BY_STATE[state], target && 'is-target', isNew && 'is-new']
    .filter(Boolean)
    .join(' ')

  const data = coords ? { 'data-x': coords.x, 'data-y': coords.y } : {}

  if (!onClick) return <span className={classes} aria-label={label} {...data} />
  return <button type="button" className={classes} aria-label={label} onClick={onClick} {...data} />
}

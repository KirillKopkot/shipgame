import { Cell } from './Cell'
import type { CellView } from './Cell'
import { COLUMNS, cellName } from './cellView'

interface BoardProps {
  cells: CellView[][]
  /** Compact preview: no axes, not interactive. */
  small?: boolean
  locked?: boolean
  /** Aimed cell, shown with the crosshair. */
  target?: { x: number; y: number } | null
  onCellClick?: (x: number, y: number) => void
}

export function Board({ cells, small, locked, target, onCellClick }: BoardProps) {
  const grid = (
    <div className={['bs-board', small && 'bs-board--sm', locked && 'is-locked'].filter(Boolean).join(' ')}>
      {cells.map((row, y) =>
        row.map((state, x) => (
          <Cell
            key={`${x}-${y}`}
            state={state}
            target={target?.x === x && target?.y === y}
            label={small ? undefined : `${cellName(x, y)}`}
            onClick={!small && onCellClick ? () => onCellClick(x, y) : undefined}
          />
        )),
      )}
    </div>
  )

  if (small) return grid

  return (
    <div className="bs-grid ui-board-grid" style={{ ['--ax' as string]: '24px' }}>
      <span />
      <div className="bs-axis bs-axis--x bs-axis--lg" aria-hidden="true">
        {Array.from(COLUMNS, (c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="bs-axis bs-axis--y bs-axis--lg" aria-hidden="true">
        {cells.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      {grid}
    </div>
  )
}

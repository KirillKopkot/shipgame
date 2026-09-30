import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { Cell } from './Cell'
import type { CellView } from './Cell'
import { COLUMNS, cellName } from './cellView'

interface BoardCell {
  x: number
  y: number
}

interface BoardProps {
  cells: CellView[][]
  /** Compact preview: no axes, not interactive. */
  small?: boolean
  locked?: boolean
  /** Aimed cell, shown with the crosshair. */
  target?: BoardCell | null
  /** A cell was chosen: click, keyboard, or a finger lifted over it. */
  onCellClick?: (x: number, y: number) => void
  /**
   * The pointer is over a cell (mouse hover, or a finger held down); null when it leaves.
   * Lets a screen show a preview before the cell is chosen.
   */
  onCellAim?: (cell: BoardCell | null) => void
}

function cellAt(clientX: number, clientY: number): BoardCell | null {
  const el = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-x]')
  if (!el) return null
  return { x: Number(el.dataset.x), y: Number(el.dataset.y) }
}

export function Board({ cells, small, locked, target, onCellClick, onCellAim }: BoardProps) {
  // After a touch is committed on pointerup, the browser still sends a click on the cell
  // where the finger went down; ignore it.
  const ignoreClick = useRef(false)
  const interactive = !small && !!onCellClick

  function handlePointer(e: PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    const touch = e.pointerType !== 'mouse'

    switch (e.type) {
      case 'pointerdown':
        if (touch) onCellAim?.(cellAt(e.clientX, e.clientY))
        break
      case 'pointermove':
        // mouse: hover; touch: only fires while the finger is down
        onCellAim?.(cellAt(e.clientX, e.clientY))
        break
      case 'pointerup':
        if (touch) {
          const cell = cellAt(e.clientX, e.clientY)
          onCellAim?.(null)
          if (cell) {
            ignoreClick.current = true
            setTimeout(() => {
              ignoreClick.current = false
            }, 400)
            onCellClick?.(cell.x, cell.y)
          }
        }
        break
      case 'pointerleave':
      case 'pointercancel':
        onCellAim?.(null)
        break
    }
  }

  const grid = (
    <div
      className={['bs-board', small && 'bs-board--sm', locked && 'is-locked', interactive && 'ui-board--touch']
        .filter(Boolean)
        .join(' ')}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handlePointer}
      onPointerLeave={handlePointer}
      onPointerCancel={handlePointer}
    >
      {cells.map((row, y) =>
        row.map((state, x) => (
          <Cell
            key={`${x}-${y}`}
            state={state}
            target={target?.x === x && target?.y === y}
            label={small ? undefined : cellName(x, y)}
            coords={{ x, y }}
            onClick={
              interactive
                ? () => {
                    if (!ignoreClick.current) onCellClick?.(x, y)
                  }
                : undefined
            }
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

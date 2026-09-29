import { inBounds, shipCells } from './board'
import type { Board, FireOutcome, ShotResult } from './types'

/** Fires at (x, y). Pure: never mutates `board`; on error nothing changes. */
export function fire(board: Board, x: number, y: number): FireOutcome {
  if (!inBounds(x, y)) return { ok: false, error: 'out-of-bounds' }
  const target = board.cells[y][x]
  if (target.state !== 'unknown') return { ok: false, error: 'already-shot' }

  const cells = board.cells.map((row) => row.map((c) => ({ ...c })))

  if (target.shipId === null) {
    cells[y][x].state = 'miss'
    return { ok: true, result: 'miss', board: { cells, ships: board.ships } }
  }

  cells[y][x].state = 'hit'
  const ships = board.ships.map((s) => (s.id === target.shipId ? { ...s, hits: s.hits + 1 } : s))
  const ship = ships.find((s) => s.id === target.shipId)!
  let result: ShotResult = 'hit'

  if (ship.hits >= ship.size) {
    result = 'sunk'
    for (const c of shipCells(ship.x, ship.y, ship.size, ship.orientation)) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = c.x + dx
          const ny = c.y + dy
          if (inBounds(nx, ny) && cells[ny][nx].shipId === null && cells[ny][nx].state === 'unknown') {
            cells[ny][nx].state = 'miss'
          }
        }
      }
    }
  }

  return { ok: true, result, board: { cells, ships } }
}

export function isSunk(board: Board, shipId: number): boolean {
  const ship = board.ships.find((s) => s.id === shipId)
  return !!ship && ship.hits >= ship.size
}

/** True when the board has ships and all of them are sunk. */
export function isFleetDestroyed(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every((s) => s.hits >= s.size)
}

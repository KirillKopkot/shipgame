import { FLEET, canPlace, inBounds, shipCells } from './board'
import type { Board, Orientation } from './types'

/** How many ships of each size are still to be placed, e.g. { 4: 1, 3: 2, 2: 3, 1: 4 } on an empty board. */
export function remainingBySize(board: Board): Record<number, number> {
  const left: Record<number, number> = {}
  for (const size of FLEET) left[size] = (left[size] ?? 0) + 1
  for (const ship of board.ships) left[ship.size] = Math.max(0, (left[ship.size] ?? 0) - 1)
  return left
}

/** True when every ship of the fleet is on the board. */
export function isFleetComplete(board: Board): boolean {
  return board.ships.length === FLEET.length
}

export interface ShipPreview {
  /** Cells the ship would cover, only those inside the board. */
  cells: { x: number; y: number }[]
  /** True if the ship can be placed here (in bounds, no overlap, no touching). */
  valid: boolean
}

export function previewShip(
  board: Board,
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
): ShipPreview {
  return {
    cells: shipCells(x, y, size, orientation).filter((c) => inBounds(c.x, c.y)),
    valid: canPlace(board, x, y, size, orientation),
  }
}

/** Id of the ship occupying the cell, or null. */
export function shipIdAt(board: Board, x: number, y: number): number | null {
  return inBounds(x, y) ? board.cells[y][x].shipId : null
}

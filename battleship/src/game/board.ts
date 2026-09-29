import type { Board, Cell, Orientation, Ship } from './types'

export const BOARD_SIZE = 10

/** Ship sizes of the full fleet: 1x4, 2x3, 3x2, 4x1. */
export const FLEET: readonly number[] = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]

export function createEmptyBoard(): Board {
  const cells: Cell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => ({ shipId: null, state: 'unknown' })),
  )
  return { cells, ships: [] }
}

export function inBounds(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE
}

export function shipCells(
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
): { x: number; y: number }[] {
  return Array.from({ length: size }, (_, i) => ({
    x: orientation === 'horizontal' ? x + i : x,
    y: orientation === 'vertical' ? y + i : y,
  }))
}

/** True if the ship fits in bounds and no other ship is in or adjacent (incl. diagonally) to its cells. */
export function canPlace(
  board: Board,
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
): boolean {
  if (!Number.isInteger(size) || size < 1) return false
  for (const c of shipCells(x, y, size, orientation)) {
    if (!inBounds(c.x, c.y)) return false
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = c.x + dx
        const ny = c.y + dy
        if (inBounds(nx, ny) && board.cells[ny][nx].shipId !== null) return false
      }
    }
  }
  return true
}

/** Returns a new board with the ship added, or null if the placement is invalid. */
export function placeShip(
  board: Board,
  x: number,
  y: number,
  size: number,
  orientation: Orientation,
): Board | null {
  if (!canPlace(board, x, y, size, orientation)) return null
  const id = board.ships.reduce((max, s) => Math.max(max, s.id), -1) + 1
  const ship: Ship = { id, size, x, y, orientation, hits: 0 }
  const cells = board.cells.map((row) => row.map((c) => ({ ...c })))
  for (const c of shipCells(x, y, size, orientation)) cells[c.y][c.x].shipId = id
  return { cells, ships: [...board.ships, ship] }
}

/** Returns a new board without the given ship. Unknown ids return the board unchanged. */
export function removeShip(board: Board, shipId: number): Board {
  if (!board.ships.some((s) => s.id === shipId)) return board
  const cells = board.cells.map((row) =>
    row.map((c): Cell => (c.shipId === shipId ? { ...c, shipId: null } : { ...c })),
  )
  return { cells, ships: board.ships.filter((s) => s.id !== shipId) }
}

/** Random valid placement of the whole fleet. `rng` returns a number in [0, 1). */
export function randomPlacement(rng: () => number = Math.random): Board {
  const MAX_ATTEMPTS = 1000
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let board = createEmptyBoard()
    let ok = true
    for (const size of FLEET) {
      const options: { x: number; y: number; o: Orientation }[] = []
      for (const o of ['horizontal', 'vertical'] as const) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          for (let x = 0; x < BOARD_SIZE; x++) {
            if (canPlace(board, x, y, size, o)) options.push({ x, y, o })
          }
        }
      }
      if (options.length === 0) {
        ok = false
        break
      }
      const pick = options[Math.min(options.length - 1, Math.floor(rng() * options.length))]
      board = placeShip(board, pick.x, pick.y, size, pick.o)!
    }
    if (ok) return board
  }
  throw new Error('randomPlacement: failed to place fleet')
}

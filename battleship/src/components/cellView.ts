import { toPublicView } from '../game/bot'
import type { Board } from '../game/types'
import type { CellView } from './Cell'

export const COLUMNS = 'ABCDEFGHIJ'

/** Name of a cell in the design's notation, e.g. (3, 6) -> "D7". */
export function cellName(x: number, y: number): string {
  return `${COLUMNS[x]}${y + 1}`
}

/** Maps a game board to what a viewer sees. `showShips` reveals unhit ship cells (own board). */
export function boardToCells(board: Board, showShips: boolean): CellView[][] {
  const view = toPublicView(board)
  return view.cells.map((row, y) =>
    row.map((c, x): CellView => {
      if (c !== 'unknown') return c
      return showShips && board.cells[y][x].shipId !== null ? 'ship' : 'empty'
    }),
  )
}

/**
 * Builds a cell grid from a text pattern (one string per row):
 * `.` water, `o` miss, `x` hit, `s` sunk, `#` ship.
 */
export function cellsFromPattern(rows: readonly string[]): CellView[][] {
  const byChar: Record<string, CellView> = { '.': 'empty', o: 'miss', x: 'hit', s: 'sunk', '#': 'ship' }
  return rows.map((row) => Array.from(row, (ch) => byChar[ch] ?? 'empty'))
}

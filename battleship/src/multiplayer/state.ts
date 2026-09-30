import { BOARD_SIZE, FLEET, inBounds, shipCells } from '../game/board'
import type { PublicCell, PublicView } from '../game/bot'
import { fire, isFleetDestroyed } from '../game/shooting'
import type { Board, Cell, ShotResult } from '../game/types'
import type { CellPoint, Move, StoredShip } from './types'

/** Rebuilds a board from stored ship geometry (ids kept, no shots yet). */
export function boardFromShips(ships: readonly StoredShip[]): Board {
  const cells: Cell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): Cell => ({ shipId: null, state: 'unknown' })),
  )
  for (const s of ships) {
    for (const c of shipCells(s.x, s.y, s.size, s.orientation)) cells[c.y][c.x].shipId = s.id
  }
  return {
    cells,
    ships: ships.map((s) => ({ id: s.id, size: s.size, x: s.x, y: s.y, orientation: s.orientation, hits: 0 })),
  }
}

/** Geometry of a board's ships, the part that is stored in `room_boards.ships`. */
export function shipsOfBoard(board: Board): StoredShip[] {
  return board.ships.map(({ id, size, x, y, orientation }) => ({ id, size, x, y, orientation }))
}

export interface ShotOutcome {
  result: ShotResult
  /** Cells of the ship that went down, only for `sunk`. */
  sunkCells: CellPoint[] | null
  /** True when this shot sank the last ship of the defender. */
  defeated: boolean
  /** The defender's board after the shot. */
  board: Board
}

/** The defender's side: what happens on `board` when the opponent shoots (x, y). Null if the shot is not possible. */
export function resolveShot(board: Board, x: number, y: number): ShotOutcome | null {
  const out = fire(board, x, y)
  if (!out.ok) return null

  let sunkCells: CellPoint[] | null = null
  if (out.result === 'sunk') {
    const shipId = board.cells[y][x].shipId
    const ship = out.board.ships.find((s) => s.id === shipId)
    if (ship) sunkCells = shipCells(ship.x, ship.y, ship.size, ship.orientation)
  }
  return { result: out.result, sunkCells, defeated: isFleetDestroyed(out.board), board: out.board }
}

export interface PendingReport {
  /** The opponent's shot I still have to report. */
  move: Move
  outcome: ShotOutcome
}

export interface MatchState {
  /** My board with every opponent shot applied (reported or not). */
  myBoard: Board
  /** What I know about the opponent's board, from my reported shots. */
  opponentView: PublicView
  /** An opponent shot waiting for my report, with the outcome to send. */
  pendingReport: PendingReport | null
  /** My shot waiting for the opponent's report. */
  awaitingResult: Move | null
}

const key = (x: number, y: number) => `${x},${y}`

function markSunk(cells: PublicCell[][], sunk: readonly CellPoint[]): void {
  for (const c of sunk) cells[c.y][c.x] = 'sunk'
  for (const c of sunk) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = c.x + dx
        const ny = c.y + dy
        if (inBounds(nx, ny) && cells[ny][nx] === 'unknown') cells[ny][nx] = 'miss'
      }
    }
  }
}

/**
 * Builds the state of a match for one player from the ordered list of moves.
 * Opponent shots are replayed on my ships whether or not they were reported yet, so a
 * player who reconnects re-derives the outcome of an unreported shot and can report it.
 * Repeated cells (per shooter) are ignored.
 */
export function buildMatchState(input: {
  myShips: readonly StoredShip[]
  myId: string
  moves: readonly Move[]
}): MatchState {
  const { myShips, myId } = input
  const moves = [...input.moves].sort((a, b) => a.id - b.id)

  let myBoard = boardFromShips(myShips)
  const viewCells: PublicCell[][] = Array.from({ length: BOARD_SIZE }, () =>
    new Array<PublicCell>(BOARD_SIZE).fill('unknown'),
  )
  const sunkSizes: number[] = []
  const seenMine = new Set<string>()
  const seenTheirs = new Set<string>()
  let pendingReport: PendingReport | null = null
  let awaitingResult: Move | null = null

  for (const m of moves) {
    if (m.by_user === myId) {
      if (seenMine.has(key(m.x, m.y))) continue
      seenMine.add(key(m.x, m.y))

      if (m.result === null) {
        awaitingResult = m
      } else if (m.result === 'miss') {
        viewCells[m.y][m.x] = 'miss'
      } else if (m.result === 'hit') {
        if (viewCells[m.y][m.x] !== 'sunk') viewCells[m.y][m.x] = 'hit'
      } else {
        const sunk = m.sunk_cells ?? [{ x: m.x, y: m.y }]
        markSunk(viewCells, sunk)
        sunkSizes.push(sunk.length)
      }
    } else {
      if (seenTheirs.has(key(m.x, m.y))) continue
      seenTheirs.add(key(m.x, m.y))

      const outcome = resolveShot(myBoard, m.x, m.y)
      if (!outcome) continue
      myBoard = outcome.board
      if (m.result === null) pendingReport = { move: m, outcome }
    }
  }

  const remaining = [...FLEET]
  for (const size of sunkSizes) {
    const i = remaining.indexOf(size)
    if (i >= 0) remaining.splice(i, 1)
  }

  return { myBoard, opponentView: { cells: viewCells, remaining }, pendingReport, awaitingResult }
}

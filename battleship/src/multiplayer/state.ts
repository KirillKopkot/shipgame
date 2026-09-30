import { BOARD_SIZE, FLEET, inBounds, shipCells } from '../game/board'
import type { PublicCell, PublicView } from '../game/bot'
import { fire, isFleetDestroyed } from '../game/shooting'
import type { FleetStatus } from '../game/match'
import type { Board, Cell, ShotRecord, ShotResult, Side } from '../game/types'
import type { CellPoint, Move, Room, StoredShip } from './types'

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
  /** Every resolved shot in order; `player` is me, `enemy` the opponent. */
  shots: ShotRecord[]
  /** Cells touched by the latest shot (the whole ship when it sank), for the appear animation. */
  last: { by: Side; cells: CellPoint[] } | null
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
  const shots: ShotRecord[] = []
  let last: MatchState['last'] = null

  for (const m of moves) {
    if (m.by_user === myId) {
      if (seenMine.has(key(m.x, m.y))) continue
      seenMine.add(key(m.x, m.y))

      if (m.result === null) {
        awaitingResult = m
      } else if (m.result === 'miss') {
        viewCells[m.y][m.x] = 'miss'
        shots.push({ by: 'player', x: m.x, y: m.y, result: 'miss' })
        last = { by: 'player', cells: [{ x: m.x, y: m.y }] }
      } else if (m.result === 'hit') {
        if (viewCells[m.y][m.x] !== 'sunk') viewCells[m.y][m.x] = 'hit'
        shots.push({ by: 'player', x: m.x, y: m.y, result: 'hit' })
        last = { by: 'player', cells: [{ x: m.x, y: m.y }] }
      } else {
        const sunk = m.sunk_cells ?? [{ x: m.x, y: m.y }]
        markSunk(viewCells, sunk)
        sunkSizes.push(sunk.length)
        shots.push({ by: 'player', x: m.x, y: m.y, result: 'sunk' })
        last = { by: 'player', cells: sunk }
      }
    } else {
      if (seenTheirs.has(key(m.x, m.y))) continue
      seenTheirs.add(key(m.x, m.y))

      const outcome = resolveShot(myBoard, m.x, m.y)
      if (!outcome) continue
      myBoard = outcome.board
      shots.push({ by: 'enemy', x: m.x, y: m.y, result: outcome.result })
      last = { by: 'enemy', cells: outcome.sunkCells ?? [{ x: m.x, y: m.y }] }
      if (m.result === null) pendingReport = { move: m, outcome }
    }
  }

  const remaining = [...FLEET]
  for (const size of sunkSizes) {
    const i = remaining.indexOf(size)
    if (i >= 0) remaining.splice(i, 1)
  }

  return { myBoard, opponentView: { cells: viewCells, remaining }, pendingReport, awaitingResult, shots, last }
}

/** Pips and "N left" for the opponent's fleet, from the sizes that are not sunk yet. */
export function fleetFromRemaining(remaining: readonly number[]): FleetStatus {
  const afloat = [...remaining]
  const ships = FLEET.map((size) => {
    const i = afloat.indexOf(size)
    if (i >= 0) {
      afloat.splice(i, 1)
      return { size, sunk: false }
    }
    return { size, sunk: true }
  })
  return { ships, left: ships.filter((s) => !s.sunk).length }
}

/**
 * Adds moves to the list, by id. A newer row replaces an older one (so a reported result
 * replaces the pending row), but a resolved row is never replaced by an unresolved copy that
 * arrives late. Sorted by id.
 */
export function mergeMoves(existing: readonly Move[], incoming: Move | readonly Move[]): Move[] {
  const byId = new Map(existing.map((m) => [m.id, m]))
  for (const m of Array.isArray(incoming) ? incoming : [incoming as Move]) {
    const old = byId.get(m.id)
    if (old && old.result !== null && m.result === null) continue
    byId.set(m.id, m)
  }
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

/** Match clock from the moves' server timestamps: first move to last move (once finished). */
export function matchTimes(
  moves: readonly Move[],
  finished: boolean,
  now: number,
): { startedAt: number; finishedAt: number | null } {
  if (moves.length === 0) return { startedAt: now, finishedAt: null }
  const times = moves.map((m) => Date.parse(m.created_at)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return { startedAt: now, finishedAt: null }
  return { startedAt: Math.min(...times), finishedAt: finished ? Math.max(...times) : null }
}

export type RoomStep = 'waiting' | 'placing' | 'waiting-ready' | 'playing' | 'finished'

/** Which view the player should see for the room's current state. */
export function deriveRoomStep(room: Pick<Room, 'status'>, myReady: boolean): RoomStep {
  switch (room.status) {
    case 'waiting':
      return 'waiting'
    case 'placing':
      return myReady ? 'waiting-ready' : 'placing'
    case 'playing':
      return 'playing'
    case 'finished':
      return 'finished'
  }
}

/** True when I may aim and fire: a running match, my turn, and no shot of mine still waiting for its result. */
export function canFire(room: Pick<Room, 'status' | 'turn'>, myId: string, match: Pick<MatchState, 'awaitingResult'>): boolean {
  return room.status === 'playing' && room.turn === myId && match.awaitingResult === null
}

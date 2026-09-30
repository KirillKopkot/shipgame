import { randomPlacement } from './board'
import { nextShot, toPublicView } from './bot'
import { fire, isFleetDestroyed } from './shooting'
import type { Board, Difficulty, GameState, Side } from './types'

/**
 * Starts a match: the bot's fleet is placed at random, the player shoots first.
 * `now` and `rng` are injectable for tests.
 */
export function createGame(
  playerBoard: Board,
  difficulty: Difficulty,
  now: number = Date.now(),
  rng: () => number = Math.random,
): GameState {
  return {
    difficulty,
    phase: 'playing',
    playerBoard,
    enemyBoard: randomPlacement(rng),
    turn: 'player',
    winner: null,
    shots: [],
    startedAt: now,
    finishedAt: null,
  }
}

/**
 * Applies a shot by `by` at the other side's board. Classic rules: a hit or a sunk ship
 * lets the shooter go again, a miss passes the turn. Returns `state` itself if the shot
 * is not allowed (game over, not this side's turn, out of bounds, cell already shot).
 */
function applyShot(state: GameState, by: Side, x: number, y: number, now: number): GameState {
  if (state.phase !== 'playing' || state.turn !== by) return state

  const targetBoard = by === 'player' ? state.enemyBoard : state.playerBoard
  const outcome = fire(targetBoard, x, y)
  if (!outcome.ok) return state

  const next: GameState = {
    ...state,
    enemyBoard: by === 'player' ? outcome.board : state.enemyBoard,
    playerBoard: by === 'enemy' ? outcome.board : state.playerBoard,
    shots: [...state.shots, { by, x, y, result: outcome.result }],
  }

  if (isFleetDestroyed(outcome.board)) {
    return { ...next, phase: 'finished', winner: by, finishedAt: now }
  }
  if (outcome.result === 'miss') return { ...next, turn: by === 'player' ? 'enemy' : 'player' }
  return next
}

export function playerShoot(state: GameState, x: number, y: number, now: number = Date.now()): GameState {
  return applyShot(state, 'player', x, y, now)
}

/** The bot picks a cell from the public view of the player's board only (it never sees ships). */
export function botShoot(
  state: GameState,
  rng: () => number = Math.random,
  now: number = Date.now(),
): GameState {
  if (state.phase !== 'playing' || state.turn !== 'enemy') return state
  const shot = nextShot(toPublicView(state.playerBoard), state.difficulty, rng)
  return applyShot(state, 'enemy', shot.x, shot.y, now)
}

export interface ShotStats {
  shots: number
  hits: number
  /** Whole percent, 0 when nothing was fired. */
  accuracy: number
  elapsedMs: number
}

/** The player's shooting statistics. */
export function shotStats(state: GameState, now: number = Date.now()): ShotStats {
  const mine = state.shots.filter((s) => s.by === 'player')
  const hits = mine.filter((s) => s.result !== 'miss').length
  return {
    shots: mine.length,
    hits,
    accuracy: mine.length ? Math.round((hits / mine.length) * 100) : 0,
    elapsedMs: (state.finishedAt ?? now) - state.startedAt,
  }
}

/** Turn number shown to the player: their shots so far plus the one they are about to make. */
export function turnNumber(state: GameState): number {
  return state.shots.filter((s) => s.by === 'player').length + 1
}

export interface FleetStatus {
  /** Largest first, like the fleet pips in the design. */
  ships: { size: number; sunk: boolean }[]
  /** Ships still afloat. */
  left: number
}

export function fleetStatus(board: Board): FleetStatus {
  const ships = board.ships
    .map((s) => ({ size: s.size, sunk: s.hits >= s.size }))
    .sort((a, b) => b.size - a.size || Number(a.sunk) - Number(b.sunk))
  return { ships, left: ships.filter((s) => !s.sunk).length }
}

/** Match time as m:ss, e.g. 372000 -> "6:12". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const seconds = total % 60
  return `${Math.floor(total / 60)}:${seconds < 10 ? '0' : ''}${seconds}`
}

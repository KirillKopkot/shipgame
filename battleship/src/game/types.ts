export type Difficulty = 'easy' | 'medium' | 'hard'

export type Orientation = 'horizontal' | 'vertical'

export type CellState = 'unknown' | 'miss' | 'hit'

export interface Cell {
  /** Id of the ship occupying this cell, or null for water. */
  shipId: number | null
  state: CellState
}

export interface Ship {
  id: number
  size: number
  /** Top-left cell of the ship. */
  x: number
  y: number
  orientation: Orientation
  hits: number
}

export interface Board {
  /** cells[y][x] */
  cells: Cell[][]
  ships: Ship[]
}

export type ShotResult = 'miss' | 'hit' | 'sunk'

export type FireOutcome =
  | { ok: true; result: ShotResult; board: Board }
  | { ok: false; error: 'out-of-bounds' | 'already-shot' }

export type GamePhase = 'placement' | 'playing' | 'finished'

export interface GameState {
  difficulty: Difficulty
  phase: GamePhase
  playerBoard: Board
  enemyBoard: Board
  turn: 'player' | 'enemy'
  winner: 'player' | 'enemy' | null
}

import type { Orientation, ShotResult } from '../game/types'

export type RoomStatus = 'waiting' | 'placing' | 'playing' | 'finished'

/** Row of `rooms`. Ids are auth user ids. */
export interface Room {
  id: string
  code: string
  host_id: string
  guest_id: string | null
  status: RoomStatus
  /** User who shoots now; null outside of `playing`. */
  turn: string | null
  winner: string | null
  created_at: string
}

export interface CellPoint {
  x: number
  y: number
}

/** Row of `moves`. `result` stays null until the defender reports it. */
export interface Move {
  id: number
  room_id: string
  by_user: string
  x: number
  y: number
  result: ShotResult | null
  /** Cells of the sunk ship, set together with result = 'sunk'. */
  sunk_cells: CellPoint[] | null
  created_at: string
}

/** Ship geometry as stored in `room_boards.ships` (no hit counters: hits come from the moves). */
export interface StoredShip {
  id: number
  size: number
  x: number
  y: number
  orientation: Orientation
}

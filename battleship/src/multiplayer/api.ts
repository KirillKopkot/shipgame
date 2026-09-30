import type { Board } from '../game/types'
import { ensureSession, getSupabase } from './client'
import { generateRoomCode, normalizeCode } from './roomCode'
import { shipsOfBoard } from './state'
import type { ShotOutcome } from './state'
import type { Move, Room, StoredShip } from './types'

const db = getSupabase

const MAX_CODE_ATTEMPTS = 5
const UNIQUE_VIOLATION = '23505'

/** Creates a room hosted by the current user; retries with a new code if the code is taken. */
export async function createRoom(): Promise<Room> {
  const userId = await ensureSession()
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { data, error } = await db()
      .from('rooms')
      .insert({ code: generateRoomCode(), host_id: userId })
      .select()
      .single()
    if (!error) return data as Room
    if (error.code !== UNIQUE_VIOLATION) throw error
  }
  throw new Error('Could not find a free room code, try again')
}

/** Joins a room by code. Only works while the room has no guest (enforced by `join_room` in the database). */
export async function joinRoom(code: string): Promise<Room> {
  await ensureSession()
  const { data, error } = await db().rpc('join_room', { p_code: normalizeCode(code) })
  if (error) {
    if (error.message.includes('room_not_available')) throw new Error('Room not found or already full')
    throw error
  }
  return data as Room
}

export async function loadRoom(roomId: string): Promise<{ room: Room; moves: Move[] }> {
  await ensureSession()
  const [room, moves] = await Promise.all([
    db().from('rooms').select().eq('id', roomId).single(),
    db().from('moves').select().eq('room_id', roomId).order('id', { ascending: true }),
  ])
  if (room.error) throw room.error
  if (moves.error) throw moves.error
  return { room: room.data as Room, moves: moves.data as Move[] }
}

/** My own saved layout and ready flag (the only board I can read), or null if I have not saved one. */
export async function loadMyBoard(roomId: string): Promise<{ ships: StoredShip[]; ready: boolean } | null> {
  const userId = await ensureSession()
  const { data, error } = await db()
    .from('room_boards')
    .select('ships, ready')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ? { ships: data.ships as StoredShip[], ready: data.ready as boolean } : null
}

/** Saves my ship layout (only I can ever read it). Resets `ready` to false. */
export async function saveBoard(roomId: string, board: Board): Promise<void> {
  const userId = await ensureSession()
  const { error } = await db()
    .from('room_boards')
    .upsert(
      { room_id: roomId, user_id: userId, ships: shipsOfBoard(board), ready: false },
      { onConflict: 'room_id,user_id' },
    )
  if (error) throw error
}

/** Locks my board. When both players are ready the database starts the match. */
export async function setReady(roomId: string): Promise<void> {
  const userId = await ensureSession()
  const { error } = await db()
    .from('room_boards')
    .update({ ready: true })
    .eq('room_id', roomId)
    .eq('user_id', userId)
  if (error) throw error
}

/** Fires at the opponent. The result is filled in later by the opponent's client (`reportResult`). */
export async function sendShot(roomId: string, x: number, y: number): Promise<Move> {
  const userId = await ensureSession()
  const { data, error } = await db()
    .from('moves')
    .insert({ room_id: roomId, by_user: userId, x, y })
    .select()
    .single()
  if (error) throw error
  return data as Move
}

/** Defender side: reports what the opponent's shot did to my board (see `resolveShot`). */
export async function reportResult(
  moveId: number,
  outcome: Pick<ShotOutcome, 'result' | 'sunkCells' | 'defeated'>,
): Promise<void> {
  await ensureSession()
  const { error } = await db().rpc('report_result', {
    p_move_id: moveId,
    p_result: outcome.result,
    p_sunk_cells: outcome.sunkCells,
    p_defeated: outcome.defeated,
  })
  if (error) throw error
}

export interface RoomHandlers {
  onRoom: (room: Room) => void
  onMove: (move: Move) => void
  /** Connection state of the live channel: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT or CLOSED. */
  onStatus?: (status: string) => void
}

/** Live updates of a room and its moves. Returns a function that unsubscribes. */
export function subscribeRoom(roomId: string, handlers: RoomHandlers): () => void {
  const channel = db()
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.eventType !== 'DELETE') handlers.onRoom(payload.new as Room)
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'moves', filter: `room_id=eq.${roomId}` },
      (payload) => {
        if (payload.eventType !== 'DELETE') handlers.onMove(payload.new as Move)
      },
    )
    .subscribe((status) => handlers.onStatus?.(status))

  return () => {
    void db().removeChannel(channel)
  }
}

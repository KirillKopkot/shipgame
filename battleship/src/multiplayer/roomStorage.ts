import { isCompleteCode } from './roomCode'

export const ROOM_KEY = 'battleship:room'
/** Bump when the stored shape changes; other versions are discarded. */
export const ROOM_VERSION = 1

function readRaw(): string | null {
  try {
    return localStorage.getItem(ROOM_KEY)
  } catch {
    return null
  }
}

export function clearRoomCode(): void {
  try {
    localStorage.removeItem(ROOM_KEY)
  } catch {
    // storage unavailable
  }
}

/** Remembers the room the player is in, so a reload can bring them back. */
export function saveRoomCode(code: string): void {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify({ version: ROOM_VERSION, code }))
  } catch {
    // storage unavailable: the room just won't survive a reload
  }
}

/** The remembered room code; unreadable or other-version data is deleted. */
export function loadRoomCode(): string | null {
  const raw = readRaw()
  if (raw === null) return null

  try {
    const data = JSON.parse(raw) as { version?: unknown; code?: unknown }
    if (data.version === ROOM_VERSION && typeof data.code === 'string' && isCompleteCode(data.code)) {
      return data.code
    }
  } catch {
    // corrupted: fall through and delete
  }
  clearRoomCode()
  return null
}

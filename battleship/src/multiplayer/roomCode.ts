/** No 0/O and 1/I: easy to mix up when a code is read out loud. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ROOM_CODE_LENGTH = 6

function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
}

export function generateRoomCode(rng: () => number = secureRandom): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(rng() * ROOM_CODE_ALPHABET.length)]
  }
  return code
}

/** What the user typed -> what is stored: trimmed, upper case. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase()
}

const COMPLETE_CODE = /^[A-HJ-NP-Z2-9]{6}$/

/**
 * Russian (ЙЦУКЕН) letters to the Latin letter on the same key, so a code typed with the
 * Russian layout still works. Characters a code cannot contain are dropped afterwards.
 */
const RU_LAYOUT_TO_LATIN: Record<string, string> = Object.fromEntries(
  Array.from('ЙЦУКЕНГШЩЗФЫВАПРОЛДЯЧСМИТЬ').map((ru, i) => [ru, 'QWERTYUIOPASDFGHJKLZXCVBNM'[i]]),
)

/** For a text input: upper case, Russian layout mapped to Latin, only characters a code can contain, at most 6. */
export function sanitizeRoomCode(input: string): string {
  return Array.from(input.toUpperCase(), (c) => RU_LAYOUT_TO_LATIN[c] ?? c)
    .filter((c) => ROOM_CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, ROOM_CODE_LENGTH)
}

export function isCompleteCode(code: string): boolean {
  return COMPLETE_CODE.test(code)
}

/** The room code from a `?room=CODE` link, or null if it is missing or not a valid code. */
export function parseRoomParam(search: string): string | null {
  const raw = new URLSearchParams(search).get('room')
  if (!raw) return null
  const code = normalizeCode(raw)
  return isCompleteCode(code) ? code : null
}

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

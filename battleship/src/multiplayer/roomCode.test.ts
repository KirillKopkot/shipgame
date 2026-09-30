import { describe, expect, it } from 'vitest'
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, generateRoomCode, normalizeCode } from './roomCode'

describe('generateRoomCode', () => {
  it('makes 6 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode()
      expect(code).toHaveLength(ROOM_CODE_LENGTH)
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('uses the injected rng (first and last alphabet characters)', () => {
    expect(generateRoomCode(() => 0)).toBe(ROOM_CODE_ALPHABET[0].repeat(6))
    expect(generateRoomCode(() => 0.999999)).toBe(ROOM_CODE_ALPHABET.at(-1)!.repeat(6))
  })
})

describe('normalizeCode', () => {
  it('trims and upper-cases', () => {
    expect(normalizeCode('  abc123 ')).toBe('ABC123')
  })
})

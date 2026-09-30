import { describe, expect, it } from 'vitest'
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  generateRoomCode,
  isCompleteCode,
  normalizeCode,
  parseRoomParam,
  sanitizeRoomCode,
} from './roomCode'

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

describe('sanitizeRoomCode', () => {
  it('upper-cases and keeps only characters a code can contain', () => {
    expect(sanitizeRoomCode('ab-c 1o0i2')).toBe('ABC2')
    expect(sanitizeRoomCode('abcdefghjk')).toBe('ABCDEF')
  })
})

describe('sanitizeRoomCode with the Russian layout', () => {
  it('maps letters to the Latin ones on the same keys', () => {
    // ф->A и->B с->C в->D у->E а->F
    expect(sanitizeRoomCode('фисвуа')).toBe('ABCDEF')
    expect(sanitizeRoomCode('ФИСВУА')).toBe('ABCDEF')
  })

  it('drops letters a code cannot contain and keeps digits', () => {
    // ш->I and щ->O are not in the alphabet; ё has no key mapping
    expect(sanitizeRoomCode('шщё2х3')).toBe('23')
  })
})

describe('isCompleteCode and parseRoomParam', () => {
  it('accepts exactly 6 valid characters', () => {
    expect(isCompleteCode('ABC234')).toBe(true)
    expect(isCompleteCode('ABC23')).toBe(false)
    expect(isCompleteCode('ABC23O')).toBe(false)
    expect(isCompleteCode('abc234')).toBe(false)
  })

  it('reads the room from the link and rejects bad values', () => {
    expect(parseRoomParam('?room=abc234')).toBe('ABC234')
    expect(parseRoomParam('?room=ABC23')).toBeNull()
    expect(parseRoomParam('?room=ABC23O')).toBeNull()
    expect(parseRoomParam('?other=1')).toBeNull()
    expect(parseRoomParam('')).toBeNull()
  })
})

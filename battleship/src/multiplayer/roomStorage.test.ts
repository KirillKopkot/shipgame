import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROOM_KEY, ROOM_VERSION, clearRoomCode, loadRoomCode, saveRoomCode } from './roomStorage'

let store: Map<string, string>

beforeEach(() => {
  store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('room code storage', () => {
  it('saves and loads the code', () => {
    saveRoomCode('ABC234')
    expect(loadRoomCode()).toBe('ABC234')
  })

  it('returns null when nothing is saved and after clearing', () => {
    expect(loadRoomCode()).toBeNull()
    saveRoomCode('ABC234')
    clearRoomCode()
    expect(loadRoomCode()).toBeNull()
  })

  it('discards other versions, broken JSON and invalid codes', () => {
    store.set(ROOM_KEY, JSON.stringify({ version: ROOM_VERSION + 1, code: 'ABC234' }))
    expect(loadRoomCode()).toBeNull()
    expect(store.has(ROOM_KEY)).toBe(false)

    store.set(ROOM_KEY, 'nope')
    expect(loadRoomCode()).toBeNull()
    expect(store.has(ROOM_KEY)).toBe(false)

    store.set(ROOM_KEY, JSON.stringify({ version: ROOM_VERSION, code: 'ab' }))
    expect(loadRoomCode()).toBeNull()
    expect(store.has(ROOM_KEY)).toBe(false)
  })
})

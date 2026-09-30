import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomPlacement } from './board'
import { createGame, playerShoot } from './match'
import {
  DEFAULT_SETTINGS,
  SAVE_KEY,
  SAVE_VERSION,
  clearSavedGame,
  loadSavedGame,
  parseSavedGame,
  parseSettings,
  saveGame,
} from './storage'
import type { GameState } from './types'

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

function playingGame(): GameState {
  const g = createGame(randomPlacement(), 'medium', 1000)
  const cell = g.enemyBoard.cells.flat().findIndex((c) => c.shipId !== null)
  return playerShoot(g, cell % 10, Math.floor(cell / 10))
}

describe('saved game', () => {
  it('saves after a move and loads the same state (including whose turn it is)', () => {
    const g: GameState = { ...playingGame(), turn: 'enemy' }
    saveGame(g)
    expect(JSON.parse(store.get(SAVE_KEY)!).version).toBe(SAVE_VERSION)
    expect(loadSavedGame()).toEqual(g)
  })

  it('returns null when nothing is saved', () => {
    expect(loadSavedGame()).toBeNull()
  })

  it('resets the save when the version differs', () => {
    store.set(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION + 1, game: playingGame() }))
    expect(loadSavedGame()).toBeNull()
    expect(store.has(SAVE_KEY)).toBe(false)
  })

  it('resets the save when there is no version (old format)', () => {
    store.set(SAVE_KEY, JSON.stringify(playingGame()))
    expect(loadSavedGame()).toBeNull()
    expect(store.has(SAVE_KEY)).toBe(false)
  })

  it('resets the save when it is not valid JSON or has a broken shape', () => {
    store.set(SAVE_KEY, 'not json')
    expect(loadSavedGame()).toBeNull()
    expect(store.has(SAVE_KEY)).toBe(false)

    store.set(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, game: { phase: 'playing' } }))
    expect(loadSavedGame()).toBeNull()
    expect(store.has(SAVE_KEY)).toBe(false)
  })

  it('deletes the save when the match is finished', () => {
    const g = playingGame()
    saveGame(g)
    expect(store.has(SAVE_KEY)).toBe(true)
    saveGame({ ...g, phase: 'finished', winner: 'player', finishedAt: 2000 })
    expect(store.has(SAVE_KEY)).toBe(false)
  })

  it('clearSavedGame removes the save', () => {
    saveGame(playingGame())
    clearSavedGame()
    expect(loadSavedGame()).toBeNull()
  })

  it('parseSavedGame ignores finished matches', () => {
    const finished = { ...playingGame(), phase: 'finished' }
    expect(parseSavedGame(JSON.stringify({ version: SAVE_VERSION, game: finished }))).toBeNull()
  })
})

describe('parseSettings', () => {
  it('falls back to defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('{"music":false}')).toEqual({ music: false, sound: true })
  })
})

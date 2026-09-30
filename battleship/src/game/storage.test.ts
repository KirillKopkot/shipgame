import { describe, expect, it } from 'vitest'
import { createEmptyBoard } from './board'
import { fire } from './shooting'
import { countShots, parseSavedGame, parseSettings, DEFAULT_SETTINGS } from './storage'
import type { GameState } from './types'

function sampleState(): GameState {
  return {
    difficulty: 'medium',
    phase: 'playing',
    playerBoard: createEmptyBoard(),
    enemyBoard: createEmptyBoard(),
    turn: 'player',
    winner: null,
  }
}

describe('parseSavedGame', () => {
  it('returns null for missing or broken data', () => {
    expect(parseSavedGame(null)).toBeNull()
    expect(parseSavedGame('not json')).toBeNull()
    expect(parseSavedGame('{}')).toBeNull()
  })

  it('restores a valid match in progress', () => {
    const state = sampleState()
    expect(parseSavedGame(JSON.stringify(state))).toEqual(state)
  })

  it('ignores finished matches', () => {
    const state = { ...sampleState(), phase: 'finished' }
    expect(parseSavedGame(JSON.stringify(state))).toBeNull()
  })
})

describe('countShots', () => {
  it('counts shot cells only', () => {
    let board = createEmptyBoard()
    expect(countShots(board)).toBe(0)
    for (const [x, y] of [
      [0, 0],
      [3, 4],
    ]) {
      const out = fire(board, x, y)
      if (out.ok) board = out.board
    }
    expect(countShots(board)).toBe(2)
  })
})

describe('parseSettings', () => {
  it('falls back to defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('{"music":false}')).toEqual({ music: false, sound: true })
  })
})

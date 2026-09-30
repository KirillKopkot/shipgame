import { BOARD_SIZE } from './board'
import type { Board, Difficulty, GameState } from './types'

export const SAVE_KEY = 'battleship:game'
export const SETTINGS_KEY = 'battleship:settings'

export interface Settings {
  music: boolean
  sound: boolean
}

export const DEFAULT_SETTINGS: Settings = { music: true, sound: true }

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']

function isBoard(value: unknown): value is Board {
  if (typeof value !== 'object' || value === null) return false
  const b = value as Partial<Board>
  return (
    Array.isArray(b.ships) &&
    Array.isArray(b.cells) &&
    b.cells.length === BOARD_SIZE &&
    b.cells.every((row) => Array.isArray(row) && row.length === BOARD_SIZE)
  )
}

/** Parses a saved match. Returns null unless it is a valid match in progress. */
export function parseSavedGame(raw: string | null): GameState | null {
  if (!raw) return null
  try {
    const g = JSON.parse(raw) as Partial<GameState>
    if (
      g.phase === 'playing' &&
      DIFFICULTIES.includes(g.difficulty as Difficulty) &&
      (g.turn === 'player' || g.turn === 'enemy') &&
      isBoard(g.playerBoard) &&
      isBoard(g.enemyBoard)
    ) {
      return g as GameState
    }
  } catch {
    // corrupted save: treat as no save
  }
  return null
}

/** Number of cells shot at on the board. */
export function countShots(board: Board): number {
  return board.cells.reduce((sum, row) => sum + row.filter((c) => c.state !== 'unknown').length, 0)
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function loadSavedGame(): GameState | null {
  return parseSavedGame(read(SAVE_KEY))
}

export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS
  try {
    const s = JSON.parse(raw) as Partial<Settings>
    return {
      music: typeof s.music === 'boolean' ? s.music : DEFAULT_SETTINGS.music,
      sound: typeof s.sound === 'boolean' ? s.sound : DEFAULT_SETTINGS.sound,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function loadSettings(): Settings {
  return parseSettings(read(SETTINGS_KEY))
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // storage unavailable: settings live only for this session
  }
}

import { BOARD_SIZE } from './board'
import type { Board, Difficulty, GameState, ShotRecord } from './types'

export const SAVE_KEY = 'battleship:game'
export const SETTINGS_KEY = 'battleship:settings'
/** Bump when the shape of GameState changes; saves of another version are discarded. */
export const SAVE_VERSION = 1

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

function isShot(value: unknown): value is ShotRecord {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Partial<ShotRecord>
  return (
    (s.by === 'player' || s.by === 'enemy') &&
    typeof s.x === 'number' &&
    typeof s.y === 'number' &&
    (s.result === 'miss' || s.result === 'hit' || s.result === 'sunk')
  )
}

function isPlayingGame(g: Partial<GameState> | undefined): g is GameState {
  return (
    !!g &&
    g.phase === 'playing' &&
    DIFFICULTIES.includes(g.difficulty as Difficulty) &&
    (g.turn === 'player' || g.turn === 'enemy') &&
    isBoard(g.playerBoard) &&
    isBoard(g.enemyBoard) &&
    Array.isArray(g.shots) &&
    g.shots.every(isShot) &&
    typeof g.startedAt === 'number'
  )
}

/** Parses a saved match. Returns null unless it is a valid match in progress of the current version. */
export function parseSavedGame(raw: string | null): GameState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as { version?: unknown; game?: Partial<GameState> }
    if (data.version === SAVE_VERSION && isPlayingGame(data.game)) return data.game
  } catch {
    // corrupted save: treat as no save
  }
  return null
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage unavailable
  }
}

export function clearSavedGame(): void {
  remove(SAVE_KEY)
}

/** Saves a match in progress; a finished match is not kept, its save is deleted. */
export function saveGame(game: GameState): void {
  if (game.phase !== 'playing') {
    clearSavedGame()
    return
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, game }))
  } catch {
    // storage unavailable or full: the match just won't survive a reload
  }
}

/** Loads the saved match. Unreadable or other-version data is deleted. */
export function loadSavedGame(): GameState | null {
  const raw = read(SAVE_KEY)
  if (raw === null) return null
  const game = parseSavedGame(raw)
  if (!game) clearSavedGame()
  return game
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

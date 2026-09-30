import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PRO, PRO_KEY, PRO_VERSION, isThemeOn, loadProState, parseProState, saveProState } from './storage'

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

describe('pro state', () => {
  it('is off by default', () => {
    expect(loadProState()).toEqual(DEFAULT_PRO)
  })

  it('saves with a version and loads the same state', () => {
    saveProState({ active: true, theme: true })
    expect(JSON.parse(store.get(PRO_KEY)!).version).toBe(PRO_VERSION)
    expect(loadProState()).toEqual({ active: true, theme: true })
  })

  it.each([
    ['broken JSON', '{nope'],
    ['another version', JSON.stringify({ version: PRO_VERSION + 1, active: true, theme: true })],
    ['no version', JSON.stringify({ active: true, theme: true })],
    ['wrong types', JSON.stringify({ version: PRO_VERSION, active: 'yes', theme: 1 })],
    ['a non-object', '42'],
    ['null', 'null'],
  ])('resets the value on %s', (_name, raw) => {
    store.set(PRO_KEY, raw)
    expect(parseProState(raw)).toBeNull()
    expect(loadProState()).toEqual(DEFAULT_PRO)
    expect(store.has(PRO_KEY)).toBe(false)
  })

  it('shows the theme only while Pro is active', () => {
    expect(isThemeOn({ active: true, theme: true })).toBe(true)
    expect(isThemeOn({ active: true, theme: false })).toBe(false)
    expect(isThemeOn({ active: false, theme: true })).toBe(false)
  })

  it('does not throw when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    })
    expect(loadProState()).toEqual(DEFAULT_PRO)
    expect(() => saveProState({ active: true, theme: true })).not.toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, FLEET, canPlace, createEmptyBoard, placeShip, randomPlacement, removeShip } from './board'
import { fire, isFleetDestroyed } from './shooting'
import type { Board } from './types'

function place(board: Board, x: number, y: number, size: number, o: 'horizontal' | 'vertical' = 'horizontal') {
  const next = placeShip(board, x, y, size, o)
  if (!next) throw new Error('placement failed')
  return next
}

describe('placement', () => {
  it('rejects ships out of bounds', () => {
    const b = createEmptyBoard()
    expect(canPlace(b, 7, 0, 4, 'horizontal')).toBe(false)
    expect(canPlace(b, 0, 7, 4, 'vertical')).toBe(false)
    expect(canPlace(b, -1, 0, 1, 'horizontal')).toBe(false)
    expect(canPlace(b, 6, 0, 4, 'horizontal')).toBe(true)
    expect(placeShip(b, 9, 9, 2, 'horizontal')).toBeNull()
  })

  it('rejects overlapping and edge-touching ships', () => {
    const b = place(createEmptyBoard(), 2, 2, 3)
    expect(canPlace(b, 2, 2, 1, 'horizontal')).toBe(false) // overlap
    expect(canPlace(b, 5, 2, 2, 'horizontal')).toBe(false) // side
    expect(canPlace(b, 2, 3, 2, 'horizontal')).toBe(false) // below
    expect(canPlace(b, 1, 1, 1, 'horizontal')).toBe(false) // diagonal
    expect(canPlace(b, 5, 3, 1, 'horizontal')).toBe(false) // diagonal
    expect(canPlace(b, 6, 2, 2, 'horizontal')).toBe(true)
    expect(canPlace(b, 2, 4, 2, 'horizontal')).toBe(true)
  })

  it('does not mutate the board and can remove ships', () => {
    const empty = createEmptyBoard()
    const b = place(empty, 0, 0, 2)
    expect(empty.ships).toHaveLength(0)
    expect(empty.cells[0][0].shipId).toBeNull()
    const r = removeShip(b, b.ships[0].id)
    expect(r.ships).toHaveLength(0)
    expect(r.cells[0][0].shipId).toBeNull()
    expect(b.ships).toHaveLength(1)
    expect(canPlace(r, 1, 1, 1, 'horizontal')).toBe(true)
  })

  it('randomPlacement builds a valid full fleet', () => {
    for (let i = 0; i < 50; i++) {
      const b = randomPlacement()
      expect(b.ships.map((s) => s.size).sort()).toEqual([...FLEET].sort())
      let occupied = 0
      for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) if (b.cells[y][x].shipId !== null) occupied++
      expect(occupied).toBe(20)
      // no touching: removing each ship, it must be placeable again
      for (const s of b.ships) {
        expect(canPlace(removeShip(b, s.id), s.x, s.y, s.size, s.orientation)).toBe(true)
      }
    }
  })
})

describe('shooting', () => {
  it('reports miss and hit', () => {
    const b = place(createEmptyBoard(), 0, 0, 2)
    const miss = fire(b, 5, 5)
    expect(miss).toMatchObject({ ok: true, result: 'miss' })
    const hit = fire(b, 0, 0)
    expect(hit).toMatchObject({ ok: true, result: 'hit' })
  })

  it('forbids repeated shots and leaves state unchanged', () => {
    const b = place(createEmptyBoard(), 0, 0, 2)
    const first = fire(b, 0, 0)
    if (!first.ok) throw new Error()
    const snapshot = JSON.stringify(first.board)
    expect(fire(first.board, 0, 0)).toEqual({ ok: false, error: 'already-shot' })
    expect(JSON.stringify(first.board)).toBe(snapshot)
    const m = fire(b, 5, 5)
    if (!m.ok) throw new Error()
    expect(fire(m.board, 5, 5)).toEqual({ ok: false, error: 'already-shot' })
  })

  it('rejects out-of-bounds shots', () => {
    expect(fire(createEmptyBoard(), 10, 0)).toEqual({ ok: false, error: 'out-of-bounds' })
    expect(fire(createEmptyBoard(), 0, -1)).toEqual({ ok: false, error: 'out-of-bounds' })
  })

  it('does not mutate the original board', () => {
    const b = place(createEmptyBoard(), 0, 0, 1)
    const snapshot = JSON.stringify(b)
    fire(b, 0, 0)
    fire(b, 3, 3)
    expect(JSON.stringify(b)).toBe(snapshot)
  })

  it('sinks a ship and marks surrounding cells as misses', () => {
    let b = place(createEmptyBoard(), 3, 3, 2)
    const h = fire(b, 3, 3)
    if (!h.ok) throw new Error()
    expect(h.result).toBe('hit')
    const s = fire(h.board, 4, 3)
    if (!s.ok) throw new Error()
    expect(s.result).toBe('sunk')
    b = s.board
    for (let y = 2; y <= 4; y++) {
      for (let x = 2; x <= 5; x++) {
        const isShip = y === 3 && (x === 3 || x === 4)
        expect(b.cells[y][x].state).toBe(isShip ? 'hit' : 'miss')
      }
    }
    expect(b.cells[0][0].state).toBe('unknown')
    // shooting an auto-marked cell is a repeat
    expect(fire(b, 2, 2)).toEqual({ ok: false, error: 'already-shot' })
  })

  it('handles sinking at the board corner', () => {
    const b = place(createEmptyBoard(), 0, 0, 1)
    const s = fire(b, 0, 0)
    if (!s.ok) throw new Error()
    expect(s.result).toBe('sunk')
    expect(s.board.cells[0][1].state).toBe('miss')
    expect(s.board.cells[1][1].state).toBe('miss')
  })
})

describe('victory', () => {
  it('detects a destroyed fleet only when all ships are sunk', () => {
    expect(isFleetDestroyed(createEmptyBoard())).toBe(false)
    let b = place(place(createEmptyBoard(), 0, 0, 1), 5, 5, 2)
    expect(isFleetDestroyed(b)).toBe(false)
    for (const [x, y] of [[0, 0], [5, 5]]) {
      const r = fire(b, x, y)
      if (!r.ok) throw new Error()
      b = r.board
    }
    expect(isFleetDestroyed(b)).toBe(false)
    const last = fire(b, 6, 5)
    if (!last.ok) throw new Error()
    expect(last.result).toBe('sunk')
    expect(isFleetDestroyed(last.board)).toBe(true)
  })

  it('full random fleet can be destroyed by shooting every ship cell', () => {
    let b = randomPlacement()
    const targets = b.ships.flatMap((s) =>
      Array.from({ length: s.size }, (_, i) => [s.orientation === 'horizontal' ? s.x + i : s.x, s.orientation === 'vertical' ? s.y + i : s.y]),
    )
    for (const [x, y] of targets) {
      const r = fire(b, x, y)
      if (!r.ok) throw new Error()
      b = r.board
    }
    expect(isFleetDestroyed(b)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeShip, randomPlacement } from './board'
import { nextShot, toPublicView } from './bot'
import type { PublicView } from './bot'
import { fire, isFleetDestroyed } from './shooting'
import type { Board, Difficulty } from './types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Plays a whole game against a board; returns number of shots, asserting no repeats. */
function simulate(board: Board, difficulty: Difficulty, rng: () => number): number {
  let shots = 0
  while (!isFleetDestroyed(board)) {
    const shot = nextShot(toPublicView(board), difficulty, rng)
    const r = fire(board, shot.x, shot.y)
    if (!r.ok) throw new Error(`bot repeated or missed bounds at ${shot.x},${shot.y}`)
    board = r.board
    shots++
  }
  return shots
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

describe('bot', () => {
  it.each(difficulties)('%s never shoots the same cell twice and finishes the game', (d) => {
    const rng = mulberry32(1)
    for (let i = 0; i < 20; i++) {
      const shots = simulate(randomPlacement(rng), d, rng)
      expect(shots).toBeLessThanOrEqual(100)
    }
  })

  it('public view does not expose unhit ships', () => {
    const board = placeShip(createEmptyBoard(), 3, 3, 2, 'horizontal')!
    const view = toPublicView(board)
    expect(view.cells.flat().every((c) => c === 'unknown')).toBe(true)
  })

  it.each(['medium', 'hard'] as const)('%s shoots next to a fresh hit', (d) => {
    const rng = mulberry32(7)
    for (let i = 0; i < 20; i++) {
      // ship in the middle, hit one cell
      const board = placeShip(createEmptyBoard(), 4, 4, 3, 'horizontal')!
      const hit = fire(board, 5, 4)
      if (!hit.ok) throw new Error()
      const s = nextShot(toPublicView(hit.board), d, rng)
      expect(Math.abs(s.x - 5) + Math.abs(s.y - 4)).toBe(1)
    }
  })

  it.each(['medium', 'hard'] as const)('%s follows the ship direction after two hits', (d) => {
    let board = placeShip(createEmptyBoard(), 2, 5, 4, 'horizontal')!
    for (const x of [3, 4]) {
      const r = fire(board, x, 5)
      if (!r.ok) throw new Error()
      board = r.board
    }
    for (let i = 0; i < 20; i++) {
      const s = nextShot(toPublicView(board), d, mulberry32(i))
      expect(s.y).toBe(5)
      expect([2, 5]).toContain(s.x)
    }
  })

  it('does not shoot around sunk ships', () => {
    let board = placeShip(createEmptyBoard(), 0, 0, 1, 'horizontal')!
    const r = fire(board, 0, 0)
    if (!r.ok) throw new Error()
    board = r.board
    const view: PublicView = toPublicView(board)
    const rng = mulberry32(3)
    for (const d of difficulties) {
      for (let i = 0; i < 30; i++) {
        const s = nextShot(view, d, rng)
        expect(view.cells[s.y][s.x]).toBe('unknown')
      }
    }
  })

  it('hard wins faster than easy on average over 200 games', () => {
    const avg = (d: Difficulty) => {
      const rng = mulberry32(42)
      let total = 0
      for (let i = 0; i < 200; i++) total += simulate(randomPlacement(rng), d, rng)
      return total / 200
    }
    const easy = avg('easy')
    const medium = avg('medium')
    const hard = avg('hard')
    expect(hard).toBeLessThan(easy)
    expect(medium).toBeLessThan(easy)
    expect(hard).toBeLessThan(medium)
  })
})

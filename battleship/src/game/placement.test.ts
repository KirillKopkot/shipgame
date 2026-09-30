import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeShip, randomPlacement } from './board'
import { isFleetComplete, previewShip, remainingBySize, shipIdAt } from './placement'

describe('remainingBySize', () => {
  it('starts with the full fleet', () => {
    expect(remainingBySize(createEmptyBoard())).toEqual({ 4: 1, 3: 2, 2: 3, 1: 4 })
  })

  it('decreases when a ship is placed', () => {
    const board = placeShip(createEmptyBoard(), 0, 0, 3, 'horizontal')!
    expect(remainingBySize(board)).toEqual({ 4: 1, 3: 1, 2: 3, 1: 4 })
  })
})

describe('isFleetComplete', () => {
  it('is false for an empty board and true after random placement', () => {
    expect(isFleetComplete(createEmptyBoard())).toBe(false)
    const board = randomPlacement()
    expect(isFleetComplete(board)).toBe(true)
    expect(Object.values(remainingBySize(board)).every((n) => n === 0)).toBe(true)
  })
})

describe('previewShip', () => {
  const board = placeShip(createEmptyBoard(), 2, 2, 2, 'horizontal')!

  it('is valid on free water', () => {
    const p = previewShip(board, 6, 6, 3, 'vertical')
    expect(p.valid).toBe(true)
    expect(p.cells).toEqual([
      { x: 6, y: 6 },
      { x: 6, y: 7 },
      { x: 6, y: 8 },
    ])
  })

  it('is invalid when touching diagonally', () => {
    expect(previewShip(board, 4, 3, 1, 'horizontal').valid).toBe(false)
  })

  it('is invalid on overlap', () => {
    expect(previewShip(board, 2, 1, 3, 'vertical').valid).toBe(false)
  })

  it('is invalid out of bounds and only lists in-bounds cells', () => {
    const p = previewShip(board, 8, 0, 4, 'horizontal')
    expect(p.valid).toBe(false)
    expect(p.cells).toHaveLength(2)
  })
})

describe('shipIdAt', () => {
  it('returns the ship id or null', () => {
    const board = placeShip(createEmptyBoard(), 1, 1, 2, 'vertical')!
    expect(shipIdAt(board, 1, 2)).toBe(0)
    expect(shipIdAt(board, 5, 5)).toBeNull()
    expect(shipIdAt(board, -1, 0)).toBeNull()
  })
})

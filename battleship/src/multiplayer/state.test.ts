import { describe, expect, it } from 'vitest'
import { FLEET, createEmptyBoard, placeShip, randomPlacement } from '../game/board'
import type { Board } from '../game/types'
import { boardFromShips, buildMatchState, resolveShot, shipsOfBoard } from './state'
import type { Move } from './types'

const ME = 'user-me'
const OPP = 'user-opponent'

function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** A small fixed layout: a 4-ship at (0,0) horizontal, a 2-ship at (0,4) vertical, a 1-ship at (8,8). */
function smallBoard(): Board {
  let b = createEmptyBoard()
  b = placeShip(b, 0, 0, 4, 'horizontal')!
  b = placeShip(b, 0, 4, 2, 'vertical')!
  b = placeShip(b, 8, 8, 1, 'horizontal')!
  return b
}

let nextId = 1
function move(by: string, x: number, y: number, result: Move['result'] = null, sunk: Move['sunk_cells'] = null): Move {
  return {
    id: nextId++,
    room_id: 'room-1',
    by_user: by,
    x,
    y,
    result,
    sunk_cells: sunk,
    created_at: '2026-01-01T00:00:00Z',
  }
}

describe('boardFromShips', () => {
  it('rebuilds the same board from stored ship geometry', () => {
    const board = randomPlacement(seeded(3))
    expect(boardFromShips(shipsOfBoard(board))).toEqual(board)
  })

  it('does not store hit counters', () => {
    const shot = resolveShot(smallBoard(), 0, 0)!.board
    expect(Object.keys(shipsOfBoard(shot)[0]).sort()).toEqual(['id', 'orientation', 'size', 'x', 'y'])
  })
})

describe('resolveShot', () => {
  it('reports miss, hit and sunk with the sunk ship cells', () => {
    const board = smallBoard()
    expect(resolveShot(board, 5, 5)?.result).toBe('miss')
    expect(resolveShot(board, 1, 0)?.result).toBe('hit')

    const sunk = resolveShot(board, 8, 8)!
    expect(sunk.result).toBe('sunk')
    expect(sunk.sunkCells).toEqual([{ x: 8, y: 8 }])
    expect(sunk.defeated).toBe(false)
  })

  it('rejects a repeated cell', () => {
    const once = resolveShot(smallBoard(), 5, 5)!.board
    expect(resolveShot(once, 5, 5)).toBeNull()
  })
})

describe('buildMatchState: opponent shots on my board', () => {
  const myShips = shipsOfBoard(smallBoard())

  it('replays reported shots', () => {
    const state = buildMatchState({
      myShips,
      myId: ME,
      moves: [move(OPP, 5, 5, 'miss'), move(OPP, 0, 0, 'hit')],
    })
    expect(state.myBoard.cells[5][5].state).toBe('miss')
    expect(state.myBoard.cells[0][0].state).toBe('hit')
    expect(state.pendingReport).toBeNull()
    expect(state.awaitingResult).toBeNull()
  })

  it('offers the outcome of an unreported opponent shot, and re-derives it on rebuild', () => {
    const moves = [move(OPP, 5, 5, 'miss'), move(OPP, 1, 0)]
    const first = buildMatchState({ myShips, myId: ME, moves })
    expect(first.pendingReport?.move.id).toBe(moves[1].id)
    expect(first.pendingReport?.outcome.result).toBe('hit')
    expect(first.pendingReport?.outcome.defeated).toBe(false)

    const again = buildMatchState({ myShips, myId: ME, moves })
    expect(again).toEqual(first)
  })

  it('detects defeat on the last ship', () => {
    const board = smallBoard()
    const cells = board.cells.flatMap((row, y) => row.map((c, x) => ({ c, x, y }))).filter((o) => o.c.shipId !== null)

    // every shot but the last is already reported; results computed with the same rules
    let current = board
    const moves: Move[] = []
    cells.forEach((o, i) => {
      const out = resolveShot(current, o.x, o.y)!
      current = out.board
      const last = i === cells.length - 1
      moves.push(move(OPP, o.x, o.y, last ? null : out.result, last ? null : out.sunkCells))
    })

    const state = buildMatchState({ myShips, myId: ME, moves })
    expect(state.pendingReport?.outcome.result).toBe('sunk')
    expect(state.pendingReport?.outcome.defeated).toBe(true)
    expect(state.pendingReport?.outcome.sunkCells).toHaveLength(1)
  })
})

describe('buildMatchState: my shots at the opponent', () => {
  const myShips = shipsOfBoard(smallBoard())

  it('builds the opponent view from reported results', () => {
    const state = buildMatchState({
      myShips,
      myId: ME,
      moves: [move(ME, 0, 0, 'miss'), move(ME, 5, 5, 'hit'), move(ME, 7, 7, 'sunk', [{ x: 7, y: 7 }])],
    })
    const { cells, remaining } = state.opponentView
    expect(cells[0][0]).toBe('miss')
    expect(cells[5][5]).toBe('hit')
    expect(cells[7][7]).toBe('sunk')
    // ring of misses around the sunk ship, water elsewhere stays unknown
    expect(cells[6][6]).toBe('miss')
    expect(cells[8][8]).toBe('miss')
    expect(cells[3][3]).toBe('unknown')
    expect(remaining).toHaveLength(FLEET.length - 1)
  })

  it('turns earlier hits of a sunk ship into sunk cells and removes its size from remaining', () => {
    const state = buildMatchState({
      myShips,
      myId: ME,
      moves: [
        move(ME, 2, 2, 'hit'),
        move(ME, 3, 2, 'sunk', [
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ]),
      ],
    })
    expect(state.opponentView.cells[2][2]).toBe('sunk')
    expect(state.opponentView.cells[2][3]).toBe('sunk')
    expect(state.opponentView.remaining.filter((s) => s === 2)).toHaveLength(2)
  })

  it('reports my unresolved shot as awaiting a result', () => {
    const waiting = move(ME, 4, 4)
    const state = buildMatchState({ myShips, myId: ME, moves: [move(ME, 0, 0, 'miss'), waiting] })
    expect(state.awaitingResult?.id).toBe(waiting.id)
    expect(state.opponentView.cells[4][4]).toBe('unknown')
  })
})

describe('buildMatchState: robustness', () => {
  const myShips = shipsOfBoard(smallBoard())

  it('ignores a repeated cell per shooter', () => {
    const state = buildMatchState({
      myShips,
      myId: ME,
      moves: [move(OPP, 0, 0, 'hit'), move(OPP, 0, 0, 'hit'), move(ME, 5, 5, 'miss'), move(ME, 5, 5, 'hit')],
    })
    expect(state.myBoard.ships[0].hits).toBe(1)
    expect(state.opponentView.cells[5][5]).toBe('miss')
  })

  it('does not depend on the order the moves arrive in', () => {
    const moves = [
      move(OPP, 5, 5, 'miss'),
      move(ME, 1, 1, 'miss'),
      move(OPP, 1, 0, 'hit'),
      move(ME, 2, 2, 'hit'),
      move(OPP, 2, 0),
    ]
    const sorted = buildMatchState({ myShips, myId: ME, moves })
    const shuffled = buildMatchState({ myShips, myId: ME, moves: [moves[3], moves[0], moves[4], moves[1], moves[2]] })
    expect(shuffled).toEqual(sorted)
  })

  it('starts empty with no moves', () => {
    const state = buildMatchState({ myShips, myId: ME, moves: [] })
    expect(state.myBoard).toEqual(smallBoard())
    expect(state.opponentView.remaining).toEqual([...FLEET])
    expect(state.pendingReport).toBeNull()
    expect(state.awaitingResult).toBeNull()
  })
})

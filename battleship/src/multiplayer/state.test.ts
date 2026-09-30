import { describe, expect, it } from 'vitest'
import { FLEET, createEmptyBoard, placeShip, randomPlacement } from '../game/board'
import type { Board } from '../game/types'
import {
  boardFromShips,
  buildMatchState,
  canFire,
  deriveRoomStep,
  fleetFromRemaining,
  matchTimes,
  mergeMoves,
  resolveShot,
  shipsOfBoard,
} from './state'
import type { Move, Room } from './types'

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

describe('buildMatchState: shots log and last shot', () => {
  const myShips = shipsOfBoard(smallBoard())

  it('logs resolved shots of both sides in order, using the replay for the opponent', () => {
    const state = buildMatchState({
      myShips,
      myId: ME,
      moves: [move(ME, 5, 5, 'miss'), move(OPP, 1, 0), move(ME, 6, 6)],
    })
    expect(state.shots).toEqual([
      { by: 'player', x: 5, y: 5, result: 'miss' },
      { by: 'enemy', x: 1, y: 0, result: 'hit' },
    ])
  })

  it('last shot carries the whole ship when it sank', () => {
    const sunk = buildMatchState({
      myShips,
      myId: ME,
      moves: [move(ME, 2, 2, 'hit'), move(ME, 3, 2, 'sunk', [{ x: 2, y: 2 }, { x: 3, y: 2 }])],
    })
    expect(sunk.last).toEqual({ by: 'player', cells: [{ x: 2, y: 2 }, { x: 3, y: 2 }] })

    const mine = buildMatchState({ myShips, myId: ME, moves: [move(OPP, 8, 8)] })
    expect(mine.last).toEqual({ by: 'enemy', cells: [{ x: 8, y: 8 }] })
    expect(buildMatchState({ myShips, myId: ME, moves: [] }).last).toBeNull()
  })
})

describe('fleetFromRemaining', () => {
  it('marks ships that are no longer remaining as sunk', () => {
    const status = fleetFromRemaining([4, 3, 2, 2, 1, 1, 1, 1])
    expect(status.ships).toHaveLength(FLEET.length)
    expect(status.left).toBe(8)
    expect(status.ships.filter((s) => s.sunk).map((s) => s.size).sort()).toEqual([2, 3])
  })

  it('a full fleet has nothing sunk, an empty one everything', () => {
    expect(fleetFromRemaining([...FLEET]).left).toBe(FLEET.length)
    expect(fleetFromRemaining([]).left).toBe(0)
  })
})

describe('mergeMoves', () => {
  it('adds new moves in id order and replaces a pending row with its result', () => {
    const pending = { ...move(OPP, 1, 1), id: 10 }
    const resolved = { ...pending, result: 'hit' as const }
    const merged = mergeMoves([pending], [resolved, { ...move(ME, 2, 2), id: 5 }])
    expect(merged.map((m) => m.id)).toEqual([5, 10])
    expect(merged[1].result).toBe('hit')
  })

  it('never replaces a resolved row with a late unresolved copy', () => {
    const resolved = { ...move(OPP, 1, 1, 'miss'), id: 10 }
    const late = { ...resolved, result: null }
    expect(mergeMoves([resolved], late)[0].result).toBe('miss')
  })
})

describe('matchTimes', () => {
  const at = (id: number, iso: string): Move => ({ ...move(ME, id, 0, 'miss'), id, created_at: iso })

  it('runs from the first move to the last one once finished', () => {
    const moves = [at(1, '2026-01-01T10:00:00Z'), at(2, '2026-01-01T10:06:12Z')]
    expect(matchTimes(moves, true, 0)).toEqual({
      startedAt: Date.parse('2026-01-01T10:00:00Z'),
      finishedAt: Date.parse('2026-01-01T10:06:12Z'),
    })
    expect(matchTimes(moves, false, 0).finishedAt).toBeNull()
  })

  it('falls back to now without moves', () => {
    expect(matchTimes([], false, 123)).toEqual({ startedAt: 123, finishedAt: null })
  })
})

describe('room step and firing', () => {
  const room = (status: Room['status'], turn: string | null = null): Pick<Room, 'status' | 'turn'> => ({ status, turn })

  it('maps room state to the view to show', () => {
    expect(deriveRoomStep(room('waiting'), false)).toBe('waiting')
    expect(deriveRoomStep(room('placing'), false)).toBe('placing')
    expect(deriveRoomStep(room('placing'), true)).toBe('waiting-ready')
    expect(deriveRoomStep(room('playing'), true)).toBe('playing')
    expect(deriveRoomStep(room('finished'), true)).toBe('finished')
  })

  it('may fire only in a running match, on my turn, with no shot awaiting its result', () => {
    const idle = { awaitingResult: null }
    expect(canFire(room('playing', ME), ME, idle)).toBe(true)
    expect(canFire(room('playing', OPP), ME, idle)).toBe(false)
    expect(canFire(room('placing', ME), ME, idle)).toBe(false)
    expect(canFire(room('finished', ME), ME, idle)).toBe(false)
    expect(canFire(room('playing', ME), ME, { awaitingResult: move(ME, 0, 0) })).toBe(false)
  })
})

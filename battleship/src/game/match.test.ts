import { describe, expect, it } from 'vitest'
import { createEmptyBoard, placeShip, randomPlacement } from './board'
import { botShoot, createGame, fleetStatus, formatDuration, playerShoot, shotStats, turnNumber } from './match'
import type { Board, GameState } from './types'

/** Small deterministic rng in [0, 1). */
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function shipCellsOf(board: Board): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  board.cells.forEach((row, y) => row.forEach((c, x) => c.shipId !== null && out.push({ x, y })))
  return out
}

function newGame(seed = 1): GameState {
  return createGame(randomPlacement(seeded(seed)), 'medium', 1000, seeded(seed + 100))
}

describe('createGame', () => {
  it('starts with the player to shoot and a full bot fleet', () => {
    const g = newGame()
    expect(g.phase).toBe('playing')
    expect(g.turn).toBe('player')
    expect(g.winner).toBeNull()
    expect(g.shots).toEqual([])
    expect(g.enemyBoard.ships).toHaveLength(10)
    expect(g.startedAt).toBe(1000)
  })
})

describe('playerShoot', () => {
  it('a hit keeps the turn, a miss passes it', () => {
    const g = newGame()
    const [ship] = shipCellsOf(g.enemyBoard)
    const afterHit = playerShoot(g, ship.x, ship.y)
    expect(afterHit.shots.at(-1)?.result).not.toBe('miss')
    expect(afterHit.turn).toBe('player')

    const water = { x: 0, y: 0 }
    const spot = [...Array(100).keys()]
      .map((i) => ({ x: i % 10, y: Math.floor(i / 10) }))
      .find((c) => g.enemyBoard.cells[c.y][c.x].shipId === null) ?? water
    const afterMiss = playerShoot(g, spot.x, spot.y)
    expect(afterMiss.shots.at(-1)?.result).toBe('miss')
    expect(afterMiss.turn).toBe('enemy')
  })

  it('ignores a repeated shot and leaves the state untouched', () => {
    const g = newGame()
    const [ship] = shipCellsOf(g.enemyBoard)
    const once = playerShoot(g, ship.x, ship.y)
    const twice = playerShoot(once, ship.x, ship.y)
    expect(twice).toBe(once)
    expect(twice.shots).toHaveLength(1)
  })

  it('ignores shots out of turn and out of bounds', () => {
    const g = newGame()
    const enemyTurn: GameState = { ...g, turn: 'enemy' }
    expect(playerShoot(enemyTurn, 0, 0)).toBe(enemyTurn)
    expect(playerShoot(g, 10, 0)).toBe(g)
  })

  it('marks the cells around a sunk ship as misses without counting them as shots', () => {
    let enemyBoard = placeShip(createEmptyBoard(), 5, 5, 1, 'horizontal')!
    enemyBoard = placeShip(enemyBoard, 0, 0, 1, 'horizontal')!
    const g: GameState = { ...newGame(), enemyBoard }

    const next = playerShoot(g, 5, 5)
    expect(next.shots).toEqual([{ by: 'player', x: 5, y: 5, result: 'sunk' }])
    expect(next.enemyBoard.cells[4][4].state).toBe('miss')
    expect(next.enemyBoard.cells[6][6].state).toBe('miss')
    expect(next.phase).toBe('playing')
    expect(next.turn).toBe('player')
  })

  it('player wins after sinking the whole fleet, then nothing changes', () => {
    let g = newGame()
    for (const c of shipCellsOf(g.enemyBoard)) g = playerShoot(g, c.x, c.y, 5000)
    expect(g.phase).toBe('finished')
    expect(g.winner).toBe('player')
    expect(g.finishedAt).toBe(5000)
    expect(g.shots.every((s) => s.result !== 'miss')).toBe(true)
    expect(playerShoot(g, 0, 0)).toBe(g)
  })
})

describe('botShoot', () => {
  it('bot wins after sinking the player fleet', () => {
    const rng = seeded(7)
    let g: GameState = { ...newGame(2), difficulty: 'hard', turn: 'enemy' }
    for (let i = 0; i < 500 && g.phase === 'playing'; i++) {
      g = botShoot(g, rng, 9000)
      if (g.phase === 'playing' && g.turn === 'player') g = { ...g, turn: 'enemy' }
    }
    expect(g.phase).toBe('finished')
    expect(g.winner).toBe('enemy')
    expect(g.finishedAt).toBe(9000)
  })

  it('does nothing on the player turn', () => {
    const g = newGame()
    expect(botShoot(g)).toBe(g)
  })

  it('cannot see ships: the first shot does not depend on the hidden layout', () => {
    const a: GameState = { ...createGame(randomPlacement(seeded(11)), 'hard', 0, seeded(1)), turn: 'enemy' }
    const b: GameState = { ...createGame(randomPlacement(seeded(22)), 'hard', 0, seeded(1)), turn: 'enemy' }
    const shotA = botShoot(a, seeded(5)).shots[0]
    const shotB = botShoot(b, seeded(5)).shots[0]
    expect([shotA.x, shotA.y]).toEqual([shotB.x, shotB.y])
  })
})

describe('statistics', () => {
  it('computes shots, hits, accuracy, time and turn number', () => {
    const g: GameState = {
      ...newGame(),
      shots: [
        { by: 'player', x: 0, y: 0, result: 'miss' },
        { by: 'enemy', x: 1, y: 1, result: 'hit' },
        { by: 'player', x: 2, y: 2, result: 'hit' },
        { by: 'player', x: 3, y: 3, result: 'sunk' },
      ],
      finishedAt: 7000,
    }
    expect(shotStats(g)).toEqual({ shots: 3, hits: 2, accuracy: 67, elapsedMs: 6000 })
    expect(turnNumber(g)).toBe(4)
  })

  it('accuracy is 0 before the first shot', () => {
    expect(shotStats(newGame(), 2000)).toEqual({ shots: 0, hits: 0, accuracy: 0, elapsedMs: 1000 })
  })

  it('fleetStatus counts ships afloat, largest first', () => {
    const g = newGame()
    const sunk = { ...g.enemyBoard, ships: g.enemyBoard.ships.map((s, i) => (i === 0 ? { ...s, hits: s.size } : s)) }
    const status = fleetStatus(sunk)
    expect(status.ships).toHaveLength(10)
    expect(status.left).toBe(9)
    expect(status.ships[0].size).toBe(4)
  })
})

describe('formatDuration', () => {
  it('formats minutes and padded seconds', () => {
    expect(formatDuration(372000)).toBe('6:12')
    expect(formatDuration(5000)).toBe('0:05')
    expect(formatDuration(-10)).toBe('0:00')
  })
})

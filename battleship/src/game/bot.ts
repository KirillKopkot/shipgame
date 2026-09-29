import { BOARD_SIZE, FLEET, inBounds } from './board'
import type { Board, Difficulty } from './types'

export type PublicCell = 'unknown' | 'miss' | 'hit' | 'sunk'

/** What a shooter may know about the opponent's board. Never contains ship positions of unhit cells. */
export interface PublicView {
  /** cells[y][x]: 'hit' = damaged ship not yet sunk, 'sunk' = part of a sunk ship. */
  cells: PublicCell[][]
  /** Sizes of enemy ships that are not sunk yet. */
  remaining: number[]
}

export interface Shot {
  x: number
  y: number
}

/** Builds the public view of a board (what the shooter has observed so far). */
export function toPublicView(board: Board): PublicView {
  const sunkIds = new Set(board.ships.filter((s) => s.hits >= s.size).map((s) => s.id))
  const cells = board.cells.map((row) =>
    row.map((c): PublicCell => {
      if (c.state === 'unknown') return 'unknown'
      if (c.state === 'miss') return 'miss'
      return c.shipId !== null && sunkIds.has(c.shipId) ? 'sunk' : 'hit'
    }),
  )
  const remaining = [...FLEET]
  for (const s of board.ships) {
    if (!sunkIds.has(s.id)) continue
    const i = remaining.indexOf(s.size)
    if (i >= 0) remaining.splice(i, 1)
  }
  return { cells, remaining }
}

const ORTHOGONAL = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
}

function unknownCells(view: PublicView): Shot[] {
  const out: Shot[] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) if (view.cells[y][x] === 'unknown') out.push({ x, y })
  }
  return out
}

function isUnknown(view: PublicView, x: number, y: number): boolean {
  return inBounds(x, y) && view.cells[y][x] === 'unknown'
}

/** Connected groups (orthogonal) of damaged-but-not-sunk cells. */
function hitGroups(view: PublicView): Shot[][] {
  const seen = new Set<number>()
  const groups: Shot[][] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (view.cells[y][x] !== 'hit' || seen.has(y * BOARD_SIZE + x)) continue
      const group: Shot[] = []
      const stack = [{ x, y }]
      seen.add(y * BOARD_SIZE + x)
      while (stack.length) {
        const c = stack.pop()!
        group.push(c)
        for (const [dx, dy] of ORTHOGONAL) {
          const nx = c.x + dx
          const ny = c.y + dy
          if (inBounds(nx, ny) && view.cells[ny][nx] === 'hit' && !seen.has(ny * BOARD_SIZE + nx)) {
            seen.add(ny * BOARD_SIZE + nx)
            stack.push({ x: nx, y: ny })
          }
        }
      }
      groups.push(group)
    }
  }
  return groups
}

/** Cells worth shooting to finish a damaged ship, or [] if there is no damaged ship. */
function finishingShots(view: PublicView): Shot[] {
  for (const group of hitGroups(view)) {
    const candidates: Shot[] = []
    if (group.length === 1) {
      const { x, y } = group[0]
      for (const [dx, dy] of ORTHOGONAL) if (isUnknown(view, x + dx, y + dy)) candidates.push({ x: x + dx, y: y + dy })
    } else {
      // Two or more hits in a row reveal the direction: extend both ends of the line.
      const horizontal = group[0].y === group[1].y
      const xs = group.map((c) => c.x)
      const ys = group.map((c) => c.y)
      const ends: Shot[] = horizontal
        ? [
            { x: Math.min(...xs) - 1, y: group[0].y },
            { x: Math.max(...xs) + 1, y: group[0].y },
          ]
        : [
            { x: group[0].x, y: Math.min(...ys) - 1 },
            { x: group[0].x, y: Math.max(...ys) + 1 },
          ]
      for (const e of ends) if (isUnknown(view, e.x, e.y)) candidates.push(e)
    }
    if (candidates.length) return candidates
  }
  return []
}

/** For each cell: number of placements of the remaining ships that cover it. */
export function probabilityMap(view: PublicView): number[][] {
  const map = Array.from({ length: BOARD_SIZE }, () => new Array<number>(BOARD_SIZE).fill(0))
  for (const size of view.remaining) {
    for (const horizontal of [true, false]) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const cells: Shot[] = []
          let fits = true
          for (let i = 0; i < size && fits; i++) {
            const cx = horizontal ? x + i : x
            const cy = horizontal ? y : y + i
            if (isUnknown(view, cx, cy)) cells.push({ x: cx, y: cy })
            else fits = false
          }
          if (fits) for (const c of cells) map[c.y][c.x]++
        }
      }
    }
  }
  return map
}

/** Picks the next cell to shoot based only on the public view. */
export function nextShot(view: PublicView, difficulty: Difficulty, rng: () => number = Math.random): Shot {
  const free = unknownCells(view)
  if (free.length === 0) throw new Error('nextShot: no cells left to shoot')

  if (difficulty === 'easy') return pick(free, rng)

  const finishing = finishingShots(view)
  if (finishing.length) return pick(finishing, rng)

  if (difficulty === 'medium') return pick(free, rng)

  const map = probabilityMap(view)
  const best = Math.max(...free.map((c) => map[c.y][c.x]))
  return pick(
    free.filter((c) => map[c.y][c.x] === best),
    rng,
  )
}

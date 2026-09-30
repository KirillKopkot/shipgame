import { useEffect } from 'react'
import { boardToCells } from '../components/cellView'
import { shipCells } from '../game/board'
import { botShoot, fleetStatus, playerShoot, shotStats, turnNumber } from '../game/match'
import type { GameState } from '../game/types'
import { GameView } from './GameView'

interface GameScreenProps {
  game: GameState
  onUpdate: (game: GameState) => void
  /** The match is over; called after a short pause so the last shot can be seen. */
  onFinish: () => void
  onBack: () => void
  onSettings: () => void
}

const BOT_DELAY_MIN_MS = 600
const BOT_DELAY_SPREAD_MS = 300
const FINISH_DELAY_MS = 900

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Cells touched by the latest shot: the whole ship when it sank. */
function lastShot(game: GameState) {
  const last = game.shots[game.shots.length - 1]
  if (!last) return null
  if (last.result === 'sunk') {
    const board = last.by === 'player' ? game.enemyBoard : game.playerBoard
    for (const ship of board.ships) {
      const cells = shipCells(ship.x, ship.y, ship.size, ship.orientation)
      if (cells.some((c) => c.x === last.x && c.y === last.y)) return { by: last.by, cells }
    }
  }
  return { by: last.by, cells: [{ x: last.x, y: last.y }] }
}

/** Single-player match: the bot answers after a pause; everything visual lives in GameView. */
export function GameScreen({ game, onUpdate, onFinish, onBack, onSettings }: GameScreenProps) {
  const playing = game.phase === 'playing'
  const myTurn = playing && game.turn === 'player'

  // The bot moves after a pause. Also restarts it after a reload in the middle of its turn.
  useEffect(() => {
    if (game.phase !== 'playing' || game.turn !== 'enemy') return
    const id = setTimeout(
      () => onUpdate(botShoot(game)),
      BOT_DELAY_MIN_MS + Math.random() * BOT_DELAY_SPREAD_MS,
    )
    return () => clearTimeout(id)
  }, [game, onUpdate])

  useEffect(() => {
    if (game.phase !== 'finished') return
    const id = setTimeout(onFinish, FINISH_DELAY_MS)
    return () => clearTimeout(id)
  }, [game.phase, onFinish])

  return (
    <GameView
      title="VS Computer"
      heading={`${capitalize(game.difficulty)} · Turn ${turnNumber(game)}`}
      chip={`vs computer · ${game.difficulty}`}
      turn={game.turn === 'player' ? 'you' : 'enemy'}
      enemyCells={boardToCells(game.enemyBoard, false)}
      myCells={boardToCells(game.playerBoard, true)}
      enemyFleet={fleetStatus(game.enemyBoard)}
      myFleet={fleetStatus(game.playerBoard)}
      stats={shotStats(game)}
      turnNumber={turnNumber(game)}
      startedAt={game.startedAt}
      finishedAt={game.finishedAt}
      running={playing}
      shotCount={game.shots.length}
      last={lastShot(game)}
      shots={game.shots}
      canFire={myTurn}
      lockedLabel={playing ? 'Wait…' : 'Fire!'}
      onFire={(x, y) => onUpdate(playerShoot(game, x, y))}
      onBack={onBack}
      onSettings={onSettings}
    />
  )
}

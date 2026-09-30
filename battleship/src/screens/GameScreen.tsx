import { useEffect, useState } from 'react'
import { Board } from '../components/Board'
import { boardToCells, cellName } from '../components/cellView'
import { Button } from '../components/Button'
import { Cell } from '../components/Cell'
import { FleetPips } from '../components/FleetPips'
import { IconButton } from '../components/IconButton'
import { LogoMark, SunIcon } from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { TurnIndicator } from '../components/TurnIndicator'
import { shipCells } from '../game/board'
import { botShoot, fleetStatus, formatDuration, playerShoot, shotStats, turnNumber } from '../game/match'
import type { GameState, ShotRecord, Side } from '../game/types'

interface GameScreenProps {
  game: GameState
  onUpdate: (game: GameState) => void
  /** The match is over; called after a short pause so the last shot can be seen. */
  onFinish: () => void
  onBack: () => void
  onSettings: () => void
}

interface Point {
  x: number
  y: number
}

const BOT_DELAY_MIN_MS = 600
const BOT_DELAY_SPREAD_MS = 300
const FINISH_DELAY_MS = 900

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function describeShot(shot: ShotRecord): { text: string; hit: boolean } {
  const who = shot.by === 'player' ? 'You' : 'Enemy'
  const at = cellName(shot.x, shot.y)
  if (shot.result === 'sunk') return { text: `Sunk! ${who} fired at ${at}`, hit: true }
  if (shot.result === 'hit') return { text: `Hit! ${who} fired at ${at}`, hit: true }
  return { text: `Splash. ${who} fired at ${at}`, hit: false }
}

/** "Turn N · m:ss" with a running clock. Its own component so the ticking never touches the bot timer. */
function GameClock({ game }: { game: GameState }) {
  const [now, setNow] = useState(() => Date.now())
  const running = game.phase === 'playing'

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  return (
    <span className="game__clock">
      Turn {turnNumber(game)} · {formatDuration((game.finishedAt ?? now) - game.startedAt)}
    </span>
  )
}

export function GameScreen({ game, onUpdate, onFinish, onBack, onSettings }: GameScreenProps) {
  const [aim, setAim] = useState<Point | null>(null)
  // Shots that existed when the screen opened (a resumed match) do not animate again.
  const [initialShots] = useState(game.shots.length)

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

  const enemyCells = boardToCells(game.enemyBoard, false)
  const myCells = boardToCells(game.playerBoard, true)
  const enemyFleet = fleetStatus(game.enemyBoard)
  const myFleet = fleetStatus(game.playerBoard)
  const stats = shotStats(game)

  const last = game.shots.length > initialShots ? game.shots[game.shots.length - 1] : null
  function freshCells(shooter: Side): Point[] {
    if (!last || last.by !== shooter) return []
    const board = shooter === 'player' ? game.enemyBoard : game.playerBoard
    if (last.result === 'sunk') {
      for (const ship of board.ships) {
        const cells = shipCells(ship.x, ship.y, ship.size, ship.orientation)
        if (cells.some((c) => c.x === last.x && c.y === last.y)) return cells
      }
    }
    return [{ x: last.x, y: last.y }]
  }

  function handleCell(x: number, y: number) {
    if (!myTurn || enemyCells[y][x] !== 'empty') return
    setAim({ x, y })
  }

  function fireAtAim() {
    if (!myTurn || !aim) return
    onUpdate(playerShoot(game, aim.x, aim.y))
    setAim(null)
  }

  const fireButton = myTurn ? (
    <Button
      variant={aim ? 'primary' : 'disabled'}
      size="lg"
      meta={aim ? cellName(aim.x, aim.y) : undefined}
      onClick={fireAtAim}
    >
      Fire!
    </Button>
  ) : (
    <Button variant="disabled" size="lg">
      {playing ? 'Wait…' : 'Fire!'}
    </Button>
  )

  const turn = <TurnIndicator turn={game.turn === 'player' ? 'you' : 'enemy'} />
  const recent = game.shots.slice(-2).reverse().map(describeShot)

  return (
    <main className="bs-screen screen game">
      <div className="game__bar">
        <ScreenHeader
          title="VS Computer"
          heading={`${capitalize(game.difficulty)} · Turn ${turnNumber(game)}`}
          onBack={onBack}
          right={
            <IconButton label="Settings" onClick={onSettings}>
              <SunIcon />
            </IconButton>
          }
        />
      </div>
      <header className="game__desk-bar">
        <LogoMark />
        <span className="home__brand">Salvo</span>
        <span className="bs-chip">vs computer · {game.difficulty}</span>
        <div className="game__desk-turn">{turn}</div>
        <GameClock game={game} />
        <IconButton label="Settings" onClick={onSettings}>
          <SunIcon />
        </IconButton>
      </header>

      <div className="game__mobile-turn">{turn}</div>

      <div className="game__body">
        <section className="game__enemy">
          <div className="game__head">
            <h2 className="game__title">Enemy waters</h2>
            <FleetPips ships={enemyFleet.ships} />
            <span className="game__left">{enemyFleet.left} left</span>
          </div>
          <Board
            cells={enemyCells}
            target={myTurn ? aim : null}
            fresh={freshCells('player')}
            locked={!myTurn}
            onCellClick={handleCell}
          />
          <div className="game__fire game__fire--desk">{fireButton}</div>
        </section>

        <section className="game__mine">
          <div className="game__mine-mobile">
            <div className="game__mine-board">
              <Board cells={myCells} fresh={freshCells('enemy')} small />
            </div>
            <div className="game__mine-info">
              <h2 className="game__title">Your fleet</h2>
              <FleetPips ships={myFleet.ships} />
              <p className="game__meta">
                {myFleet.left} left · {stats.shots} shots
              </p>
              <ul className="game__legend">
                <li>
                  <span className="game__swatch">
                    <Cell state="miss" />
                  </span>
                  Miss
                </li>
                <li>
                  <span className="game__swatch">
                    <Cell state="hit" />
                  </span>
                  Hit
                </li>
                <li>
                  <span className="game__swatch">
                    <Cell state="sunk" />
                  </span>
                  Sunk
                </li>
              </ul>
            </div>
          </div>

          <div className="game__mine-desk">
            <div className="game__head">
              <h2 className="game__title">Your fleet</h2>
              <FleetPips ships={myFleet.ships} />
              <span className="game__left">{myFleet.left} left</span>
            </div>
            <Board cells={myCells} fresh={freshCells('enemy')} />
            <div className="game__stats">
              <div className="bs-stat">
                <b>{stats.shots}</b>
                <span>Shots</span>
              </div>
              <div className="bs-stat">
                <b>{stats.hits}</b>
                <span>Hits</span>
              </div>
              <div className="bs-stat">
                <b>{stats.accuracy}%</b>
                <span>Accuracy</span>
              </div>
            </div>
            <ul className="bs-card game__log">
              {recent.map((r, i) => (
                <li key={i}>
                  <span className={r.hit ? 'game__log-hit' : 'game__log-miss'} aria-hidden="true">
                    {r.hit ? '✕' : '●'}
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="game__fire game__fire--mobile">{fireButton}</div>
      </div>
    </main>
  )
}

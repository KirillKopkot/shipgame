import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Board } from '../components/Board'
import { cellName } from '../components/cellView'
import { Button } from '../components/Button'
import { Cell } from '../components/Cell'
import type { CellView } from '../components/Cell'
import { FleetPips } from '../components/FleetPips'
import { IconButton } from '../components/IconButton'
import { LogoMark, SunIcon } from '../components/Icons'
import { ScreenHeader } from '../components/ScreenHeader'
import { TurnIndicator } from '../components/TurnIndicator'
import type { FleetStatus } from '../game/match'
import { formatDuration } from '../game/match'
import type { ShotRecord, Side } from '../game/types'

interface Point {
  x: number
  y: number
}

export interface GameViewProps {
  /** Small label above the heading, e.g. "VS Computer". */
  title: string
  /** e.g. "Medium · Turn 15". */
  heading: string
  /** Desktop header chip, e.g. "vs computer · medium". */
  chip: string
  turn: 'you' | 'enemy'
  enemyCells: CellView[][]
  myCells: CellView[][]
  enemyFleet: FleetStatus
  myFleet: FleetStatus
  stats: { shots: number; hits: number; accuracy: number }
  turnNumber: number
  startedAt: number
  finishedAt: number | null
  /** The clock ticks while true. */
  running: boolean
  shotCount: number
  /** Cells touched by the latest shot; they play the appear animation (only for shots made while this view is open). */
  last: { by: Side; cells: Point[] } | null
  /** Shots in order; the last two are shown in the desktop log. */
  shots: readonly ShotRecord[]
  /** The player may aim and fire now. */
  canFire: boolean
  /** Label of the disabled fire button while `canFire` is false. */
  lockedLabel: string
  /** Optional notice above the boards (connection problems etc.). */
  notice?: ReactNode
  onFire: (x: number, y: number) => void
  onBack: () => void
  onSettings: () => void
}

function describeShot(shot: ShotRecord): { text: string; hit: boolean } {
  const who = shot.by === 'player' ? 'You' : 'Enemy'
  const at = cellName(shot.x, shot.y)
  if (shot.result === 'sunk') return { text: `Sunk! ${who} fired at ${at}`, hit: true }
  if (shot.result === 'hit') return { text: `Hit! ${who} fired at ${at}`, hit: true }
  return { text: `Splash. ${who} fired at ${at}`, hit: false }
}

/** "Turn N · m:ss" with a running clock. Its own component so the ticking never re-renders the whole view. */
function GameClock(props: Pick<GameViewProps, 'turnNumber' | 'startedAt' | 'finishedAt' | 'running'>) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!props.running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [props.running])

  return (
    <span className="game__clock">
      Turn {props.turnNumber} · {formatDuration((props.finishedAt ?? now) - props.startedAt)}
    </span>
  )
}

/** The match screen for both modes: the caller supplies the data and what firing does. */
export function GameView(props: GameViewProps) {
  const { enemyCells, myCells, enemyFleet, stats, canFire } = props
  const [aim, setAim] = useState<Point | null>(null)
  // Shots that existed when the view opened (a resumed match) do not animate again.
  const [initialShots] = useState(props.shotCount)

  const freshFor = (shooter: Side): Point[] =>
    props.last && props.shotCount > initialShots && props.last.by === shooter ? props.last.cells : []

  function handleCell(x: number, y: number) {
    if (!canFire || enemyCells[y][x] !== 'empty') return
    setAim({ x, y })
  }

  function fireAtAim() {
    if (!canFire || !aim) return
    props.onFire(aim.x, aim.y)
    setAim(null)
  }

  const fireButton = canFire ? (
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
      {props.lockedLabel}
    </Button>
  )

  const turn = <TurnIndicator turn={props.turn} />
  const recent = props.shots.slice(-2).reverse().map(describeShot)
  const clock = (
    <GameClock
      turnNumber={props.turnNumber}
      startedAt={props.startedAt}
      finishedAt={props.finishedAt}
      running={props.running}
    />
  )

  return (
    <main className="bs-screen screen game">
      <div className="game__bar">
        <ScreenHeader
          title={props.title}
          heading={props.heading}
          onBack={props.onBack}
          right={
            <IconButton label="Settings" onClick={props.onSettings}>
              <SunIcon />
            </IconButton>
          }
        />
      </div>
      <header className="game__desk-bar">
        <LogoMark />
        <span className="home__brand">Salvo</span>
        <span className="bs-chip">{props.chip}</span>
        <div className="game__desk-turn">{turn}</div>
        {clock}
        <IconButton label="Settings" onClick={props.onSettings}>
          <SunIcon />
        </IconButton>
      </header>

      <div className="game__mobile-turn">{turn}</div>
      {props.notice}

      <div className="game__body">
        <section className="game__enemy">
          <Board
            cells={enemyCells}
            target={canFire ? aim : null}
            fresh={freshFor('player')}
            locked={!canFire}
            onCellClick={handleCell}
          />
          <div className="game__fire game__fire--desk">{fireButton}</div>
        </section>

        <section className="game__mine">
          <div className="game__mine-mobile">
            <div className="game__mine-board">
              <Board cells={myCells} fresh={freshFor('enemy')} small />
            </div>
            <div className="game__mine-info">
              <h2 className="game__title">Enemy fleet</h2>
              <FleetPips ships={enemyFleet.ships} />
              <p className="game__meta">
                {enemyFleet.left} left · {stats.shots} shots
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
              <h2 className="game__title">Enemy fleet</h2>
              <FleetPips ships={enemyFleet.ships} />
              <span className="game__left">{enemyFleet.left} left</span>
            </div>
            <Board cells={myCells} fresh={freshFor('enemy')} />
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

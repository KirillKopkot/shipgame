import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../components/Button'
import { boardToCells, publicViewToCells } from '../components/cellView'
import { Hint } from '../components/Hint'
import { fleetStatus, shotStats, turnNumber } from '../game/match'
import { canFire, deriveRoomStep, fleetFromRemaining, matchTimes } from '../multiplayer/state'
import { GameView } from './GameView'
import { PlacementScreen } from './PlacementScreen'
import { ResultScreen } from './ResultScreen'
import { useOnlineMatch } from './useOnlineMatch'
import { WaitingRoom } from './WaitingRoom'

interface OnlineRoomScreenProps {
  code: string
  /** Back to the menu; the room is remembered and can be resumed. */
  onExit: () => void
  /** Forget the room and go to the menu. */
  onLeave: () => void
  onSettings: () => void
}

const RESULT_DELAY_MS = 900

function StatusScreen(props: { title: string; text?: string; children?: ReactNode }) {
  return (
    <main className="bs-screen screen">
      <div className="screen__intro">
        <h1 className="bs-h1">{props.title}</h1>
        {props.text && <p className="bs-body">{props.text}</p>}
      </div>
      {props.children && <div className="screen__actions">{props.children}</div>}
    </main>
  )
}

/** Online match: shows the right view for the room's state, reusing the single-player screens. */
export function OnlineRoomScreen({ code, onExit, onLeave, onSettings }: OnlineRoomScreenProps) {
  const online = useOnlineMatch(code)
  const { room, userId, match } = online
  const [mountedAt] = useState(() => Date.now())
  const [showResult, setShowResult] = useState(false)

  const finished = room?.status === 'finished'
  useEffect(() => {
    if (!finished) return
    const id = setTimeout(() => setShowResult(true), RESULT_DELAY_MS)
    return () => clearTimeout(id)
  }, [finished])

  if (online.phase === 'loading') {
    return <StatusScreen title="Connecting…" text={`Opening room ${code}.`} />
  }

  if (online.phase === 'error' || !room || !userId) {
    return (
      <StatusScreen title="Can’t open the room" text={online.error ?? 'Something went wrong. Please try again.'}>
        <Button variant="primary" onClick={online.retry}>
          Try again
        </Button>
        <Button variant="secondary" onClick={onLeave}>
          Leave room
        </Button>
      </StatusScreen>
    )
  }

  const step = deriveRoomStep(room, online.myReady)

  const notice =
    online.connectionLost || online.actionError ? (
      <div className="notice">
        <Hint tone="bad">{online.actionError ?? 'Connection lost. Trying to reconnect…'}</Hint>
        <Button size="sm" block={false} onClick={online.actionError ? online.dismissActionError : online.retry}>
          Try again
        </Button>
      </div>
    ) : undefined

  switch (step) {
    case 'waiting':
      return (
        <WaitingRoom
          code={code}
          title="Waiting for opponent"
          text="Share the code or the link. The match starts when your friend joins."
          share
          onLeave={onLeave}
        />
      )
    case 'placing':
      return (
        <PlacementScreen
          chipLabel={`Room ${code}`}
          deskChipLabel={`online · room ${code}`}
          submitLabel="Ready"
          busy={online.saving}
          error={online.actionError}
          onBack={onExit}
          onSettings={onSettings}
          onSubmit={(board) => void online.ready(board)}
        />
      )
    case 'waiting-ready':
      return (
        <WaitingRoom
          code={code}
          title="Waiting for opponent to be ready"
          text="Your fleet is locked in. The match starts as soon as your opponent is ready."
          share={false}
          onLeave={onLeave}
        />
      )
    case 'playing':
    case 'finished': {
      if (!match) {
        return (
          <StatusScreen title="Board not found" text="Your fleet for this room was not saved.">
            <Button variant="secondary" onClick={onLeave}>
              Leave room
            </Button>
          </StatusScreen>
        )
      }

      const times = matchTimes(online.moves, finished, mountedAt)
      const stats = shotStats({ shots: match.shots, ...times })

      if (finished && showResult) {
        return (
          <ResultScreen
            won={room.winner === userId}
            shots={stats.shots}
            accuracy={stats.accuracy}
            elapsedMs={stats.elapsedMs}
            onMenu={onLeave}
          />
        )
      }

      return (
        <GameView
          title="Multiplayer"
          heading={`Room ${code} · Turn ${turnNumber({ shots: match.shots })}`}
          chip={`online · room ${code}`}
          turn={room.turn === userId ? 'you' : 'enemy'}
          enemyCells={publicViewToCells(match.opponentView.cells)}
          myCells={boardToCells(match.myBoard, true)}
          enemyFleet={fleetFromRemaining(match.opponentView.remaining)}
          myFleet={fleetStatus(match.myBoard)}
          stats={stats}
          turnNumber={turnNumber({ shots: match.shots })}
          startedAt={times.startedAt}
          finishedAt={times.finishedAt}
          running={!finished}
          shotCount={match.shots.length}
          last={match.last}
          shots={match.shots}
          canFire={canFire(room, userId, match)}
          lockedLabel={finished ? 'Fire!' : 'Wait…'}
          notice={notice}
          onFire={(x, y) => void online.fire(x, y)}
          onBack={onExit}
          onSettings={onSettings}
        />
      )
    }
  }
}

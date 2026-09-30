import { Button } from '../components/Button'
import { DefeatArt, VictoryArt } from '../components/ResultArt'
import { FLEET } from '../game/board'
import { formatDuration, shotStats } from '../game/match'
import type { GameState } from '../game/types'

interface ResultScreenProps {
  game: GameState
  onRematch: () => void
  onMenu: () => void
}

export function ResultScreen({ game, onRematch, onMenu }: ResultScreenProps) {
  const won = game.winner === 'player'
  const stats = shotStats(game)

  return (
    <main className="bs-screen screen result">
      <div className="result__hero">
        {won ? <VictoryArt /> : <DefeatArt />}
        <p className="bs-eyebrow result__eyebrow">{won ? 'Enemy fleet sunk' : 'Your fleet is gone'}</p>
        <h1 className={`bs-title result__title ${won ? 'result__title--win' : 'result__title--lose'}`}>
          {won ? 'Victory!' : 'Defeat'}
        </h1>
        <p className="bs-body result__text">
          {won
            ? `All ${FLEET.length} enemy ships are on the seabed. Well fought, captain!`
            : `The enemy sank all ${FLEET.length} of your ships. Regroup and go again!`}
        </p>
      </div>

      <div className="result__stats">
        <div className="bs-stat">
          <b>{stats.shots}</b>
          <span>Shots</span>
        </div>
        <div className="bs-stat">
          <b>{stats.accuracy}%</b>
          <span>Accuracy</span>
        </div>
        <div className="bs-stat">
          <b>{formatDuration(stats.elapsedMs)}</b>
          <span>Time</span>
        </div>
      </div>

      <div className="screen__actions result__actions">
        <Button variant="primary" onClick={onRematch}>
          Rematch
        </Button>
        <Button variant="secondary" onClick={onMenu}>
          Main menu
        </Button>
      </div>
    </main>
  )
}

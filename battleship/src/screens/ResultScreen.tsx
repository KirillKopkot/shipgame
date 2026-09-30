import { Button } from '../components/Button'
import { DefeatArt, VictoryArt } from '../components/ResultArt'
import { FLEET } from '../game/board'
import { formatDuration } from '../game/match'

interface ResultScreenProps {
  won: boolean
  shots: number
  /** Whole percent. */
  accuracy: number
  elapsedMs: number
  /** Without it there is no Rematch button (online matches). */
  onRematch?: () => void
  onMenu: () => void
}

export function ResultScreen({ won, shots, accuracy, elapsedMs, onRematch, onMenu }: ResultScreenProps) {
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
          <b>{shots}</b>
          <span>Shots</span>
        </div>
        <div className="bs-stat">
          <b>{accuracy}%</b>
          <span>Accuracy</span>
        </div>
        <div className="bs-stat">
          <b>{formatDuration(elapsedMs)}</b>
          <span>Time</span>
        </div>
      </div>

      <div className="screen__actions result__actions">
        {onRematch && (
          <Button variant="primary" onClick={onRematch}>
            Rematch
          </Button>
        )}
        <Button variant="secondary" onClick={onMenu}>
          Main menu
        </Button>
      </div>
    </main>
  )
}

import { Board } from '../components/Board'
import { boardToCells } from '../components/cellView'
import { Card } from '../components/Card'
import { ChevronIcon, LogoMark, PeopleIcon, SunIcon, TargetIcon } from '../components/Icons'
import { countShots } from '../game/storage'
import type { GameState } from '../game/types'

interface HomeScreenProps {
  isGuest: boolean
  savedGame: GameState | null
  onContinue: () => void
  onSinglePlayer: () => void
  onMultiplayer: () => void
  onSettings: () => void
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function HomeScreen({
  isGuest,
  savedGame,
  onContinue,
  onSinglePlayer,
  onMultiplayer,
  onSettings,
}: HomeScreenProps) {
  return (
    <main className="bs-screen screen">
      <header className="home__header">
        <LogoMark />
        <span className="home__brand">Salvo</span>
        {isGuest && <span className="bs-chip home__badge">Guest</span>}
      </header>

      <div className="home__hero">
        <p className="bs-eyebrow">Ready when you are</p>
        <h1 className="home__title">Command the sea.</h1>
      </div>

      <nav className="screen__actions" aria-label="Main menu">
        {savedGame && (
          <Card selected onClick={onContinue}>
            <span className="continue">
              <span className="continue__board">
                <Board cells={boardToCells(savedGame.playerBoard, true)} small />
              </span>
              <span className="continue__text">
                <span className="bs-eyebrow continue__eyebrow">Game in progress</span>
                <span className="continue__title">Continue</span>
                <span className="continue__meta">
                  {capitalize(savedGame.difficulty)} · {countShots(savedGame.enemyBoard)} shots ·{' '}
                  {savedGame.turn === 'player' ? 'Your turn' : 'Enemy turn'}
                </span>
              </span>
            </span>
          </Card>
        )}
        <button type="button" className="bs-menu-row" onClick={onSinglePlayer}>
          <TargetIcon />
          <span>Single Player</span>
          <ChevronIcon />
        </button>
        <button type="button" className="bs-menu-row" onClick={onMultiplayer}>
          <PeopleIcon />
          <span>Multiplayer</span>
          <ChevronIcon />
        </button>
        <button type="button" className="bs-menu-row" onClick={onSettings}>
          <SunIcon />
          <span>Settings</span>
          <ChevronIcon />
        </button>
      </nav>
    </main>
  )
}

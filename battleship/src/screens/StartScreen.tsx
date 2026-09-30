import { Button } from '../components/Button'
import { StartHero } from '../components/StartHero'

interface StartScreenProps {
  onGuest: () => void
  onSignIn: () => void
}

const TITLE_LETTERS: { char: string; color: string }[] = [
  { char: 'S', color: 'var(--bs-color-orange)' },
  { char: 'A', color: 'var(--bs-color-yellow)' },
  { char: 'L', color: 'var(--bs-color-green)' },
  { char: 'V', color: 'var(--bs-color-surface)' },
  { char: 'O', color: 'var(--bs-color-red)' },
]

export function StartScreen({ onGuest, onSignIn }: StartScreenProps) {
  return (
    <main className="bs-screen screen start">
      <div className="start__hero">
        <StartHero />
        <h1 className="bs-title start__title" aria-label="Salvo">
          {TITLE_LETTERS.map(({ char, color }) => (
            <span key={char} style={{ color }} aria-hidden="true">
              {char}
            </span>
          ))}
        </h1>
        <p className="bs-body start__tagline">Find the fleet. Sink it first!</p>
      </div>
      <div className="screen__actions">
        <Button variant="primary" onClick={onGuest}>
          Play as Guest
        </Button>
        <Button variant="secondary" onClick={onSignIn}>
          Sign in / Create account
        </Button>
      </div>
    </main>
  )
}

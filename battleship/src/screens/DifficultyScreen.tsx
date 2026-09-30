import { Board } from '../components/Board'
import { cellsFromPattern } from '../components/cellView'
import { Card } from '../components/Card'
import { ScreenHeader } from '../components/ScreenHeader'
import type { Difficulty } from '../game/types'

interface DifficultyScreenProps {
  onBack: () => void
  onSelect: (difficulty: Difficulty) => void
}

interface Option {
  id: Difficulty
  title: string
  text: string
  popular?: boolean
  /** Illustration of the bot's shooting style. */
  pattern: string[]
}

const OPTIONS: Option[] = [
  {
    id: 'easy',
    title: 'Easy',
    text: 'Fires at random and forgets its hits. Good for learning the ropes.',
    pattern: [
      '.....o....',
      '.o........',
      '..x.o.....',
      '..........',
      'o.......o.',
      '..........',
      '.o........',
      '..........',
      'o...o.....',
      '..........',
    ],
  },
  {
    id: 'medium',
    title: 'Medium',
    text: 'Hunts around every hit until the ship goes down.',
    popular: true,
    pattern: [
      'o.........',
      '..........',
      '....o.....',
      '..oxxxo...',
      '....o.....',
      '..........',
      '..........',
      '......o...',
      '..........',
      '..........',
    ],
  },
  {
    id: 'hard',
    title: 'Hard',
    text: 'Skips wasted squares and plays the odds. Bring your best fleet.',
    pattern: [
      'o...o.....',
      'o....o....',
      '..o.......',
      '.ssss.....',
      'o...o.....',
      '....o.....',
      '.....o....',
      '.o...o....',
      '..........',
      '.......o..',
    ],
  },
]

export function DifficultyScreen({ onBack, onSelect }: DifficultyScreenProps) {
  return (
    <main className="bs-screen screen">
      <ScreenHeader title="Single Player" onBack={onBack} />
      <div className="screen__intro">
        <h1 className="bs-h1">Pick your opponent</h1>
        <p className="bs-body">Tap a card to choose how smart the computer plays.</p>
      </div>
      <div className="screen__list">
        {OPTIONS.map((o) => (
          <Card key={o.id} selected={o.popular} onClick={() => onSelect(o.id)}>
            <span className="difficulty">
              <span className="difficulty__board">
                <Board cells={cellsFromPattern(o.pattern)} small />
              </span>
              <span className="difficulty__text">
                <span className="difficulty__head">
                  <span className="difficulty__title">{o.title}</span>
                  {o.popular && <span className="bs-chip bs-chip--accent">Popular</span>}
                </span>
                <span className="bs-body">{o.text}</span>
              </span>
            </span>
          </Card>
        ))}
      </div>
    </main>
  )
}

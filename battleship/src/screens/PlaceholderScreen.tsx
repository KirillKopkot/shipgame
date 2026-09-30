import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'

interface PlaceholderScreenProps {
  title: string
  onBack: () => void
}

/** Temporary stand-in for screens that are not built yet (placement, game, result). */
export function PlaceholderScreen({ title, onBack }: PlaceholderScreenProps) {
  return (
    <main className="bs-screen screen">
      <ScreenHeader title={title} onBack={onBack} />
      <div className="screen__intro">
        <h1 className="bs-h1">Coming soon</h1>
      </div>
      <div className="screen__actions">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </main>
  )
}

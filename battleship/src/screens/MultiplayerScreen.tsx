import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ScreenHeader } from '../components/ScreenHeader'

interface MultiplayerScreenProps {
  onBack: () => void
}

/** Placeholder: looks like the design, the online mode is not built yet. */
export function MultiplayerScreen({ onBack }: MultiplayerScreenProps) {
  return (
    <main className="bs-screen screen">
      <ScreenHeader
        title="Multiplayer"
        onBack={onBack}
        right={<span className="bs-chip bs-chip--accent">Coming soon</span>}
      />
      <div className="screen__intro">
        <h1 className="bs-h1">Play a friend</h1>
        <p className="bs-body">Start a room and share the code, or enter a code you got.</p>
      </div>
      <div className="screen__list">
        <Card>
          <div className="panel">
            <div>
              <h2 className="panel__title">Host a match</h2>
              <p className="bs-body">You get a 6-letter room code.</p>
            </div>
            <Button variant="primary">Create room</Button>
          </div>
        </Card>
        <div className="divider" role="separator">
          <span>Or</span>
        </div>
        <Card>
          <div className="panel">
            <div>
              <h2 className="panel__title">Join by code</h2>
              <p className="bs-body">Ask your friend for their code.</p>
            </div>
            <div>
              <label className="bs-label" htmlFor="room-code">
                Room code
              </label>
              <input
                id="room-code"
                className="bs-input bs-input--code"
                placeholder="ABC123"
                maxLength={6}
                autoComplete="off"
                readOnly
              />
            </div>
            <Button variant="secondary">Join room</Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Hint } from '../components/Hint'
import { ScreenHeader } from '../components/ScreenHeader'
import { createRoom, joinRoom } from '../multiplayer/api'
import { isConfigured } from '../multiplayer/client'
import { classifyError, describeError } from '../multiplayer/errors'
import { isCompleteCode, sanitizeRoomCode } from '../multiplayer/roomCode'
import { saveRoomCode } from '../multiplayer/roomStorage'

interface MultiplayerScreenProps {
  onBack: () => void
  /** A room was created or joined; open it. */
  onEnterRoom: (code: string) => void
}

type Action = 'create' | 'join'

export function MultiplayerScreen({ onBack, onEnterRoom }: MultiplayerScreenProps) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<Action | null>(null)
  const [problem, setProblem] = useState<{ text: string; retry: Action | null } | null>(null)
  const configured = isConfigured()

  async function run(action: Action) {
    if (action === 'join' && !isCompleteCode(code)) {
      setProblem({ text: 'Enter the 6-character room code.', retry: null })
      return
    }
    setBusy(action)
    setProblem(null)
    try {
      const room = action === 'create' ? await createRoom() : await joinRoom(code)
      saveRoomCode(room.code)
      onEnterRoom(room.code)
    } catch (e) {
      setProblem({ text: describeError(e), retry: classifyError(e) === 'network' ? action : null })
    } finally {
      setBusy(null)
    }
  }

  function submitJoin(e: FormEvent) {
    e.preventDefault()
    void run('join')
  }

  return (
    <main className="bs-screen screen">
      <ScreenHeader title="Multiplayer" onBack={onBack} />
      <div className="screen__intro">
        <h1 className="bs-h1">Play a friend</h1>
        <p className="bs-body">Start a room and share the code, or enter a code you got.</p>
      </div>

      {!configured && <Hint tone="bad">Multiplayer is not set up on this build.</Hint>}
      {problem && (
        <div className="notice">
          <Hint tone="bad">{problem.text}</Hint>
          {problem.retry && (
            <Button size="sm" block={false} onClick={() => void run(problem.retry!)}>
              Try again
            </Button>
          )}
        </div>
      )}

      <div className="screen__list">
        <Card>
          <div className="panel">
            <div>
              <h2 className="panel__title">Host a match</h2>
              <p className="bs-body">You get a 6-letter room code.</p>
            </div>
            <Button
              variant={configured && busy === null ? 'primary' : 'disabled'}
              onClick={() => void run('create')}
            >
              {busy === 'create' ? 'Creating…' : 'Create room'}
            </Button>
          </div>
        </Card>
        <div className="divider" role="separator">
          <span>Or</span>
        </div>
        <Card>
          <form className="panel" onSubmit={submitJoin}>
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
                value={code}
                onChange={(e) => {
                  setCode(sanitizeRoomCode(e.target.value))
                  setProblem(null)
                }}
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={!configured}
              />
            </div>
            <Button
              variant={configured && busy === null ? 'secondary' : 'disabled'}
              type="submit"
            >
              {busy === 'join' ? 'Joining…' : 'Join room'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}

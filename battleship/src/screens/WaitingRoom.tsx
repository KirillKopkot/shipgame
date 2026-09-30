import { useState } from 'react'
import { Button } from '../components/Button'
import { Hint } from '../components/Hint'
import { ScreenHeader } from '../components/ScreenHeader'

interface WaitingRoomProps {
  code: string
  title: string
  text: string
  /** Show "Copy code" and "Copy link" (only while nobody has joined yet). */
  share: boolean
  onLeave: () => void
}

function roomLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`
}

export function WaitingRoom({ code, title, text, share, onLeave }: WaitingRoomProps) {
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value)
      setNotice({ tone: 'ok', text: `${what} copied.` })
    } catch {
      setNotice({ tone: 'bad', text: `Could not copy the ${what.toLowerCase()}. Select it and copy manually.` })
    }
  }

  return (
    <main className="bs-screen screen">
      <ScreenHeader title="Multiplayer" onBack={onLeave} />
      <div className="screen__intro">
        <h1 className="bs-h1">{title}</h1>
        <p className="bs-body">{text}</p>
      </div>

      <div className="bs-card waiting__code" role="group" aria-label="Room code">
        <span className="bs-label waiting__label">Room code</span>
        <p className="waiting__letters">{code}</p>
      </div>

      {notice && <Hint tone={notice.tone}>{notice.text}</Hint>}

      <div className="screen__actions">
        {share && (
          <>
            <Button variant="primary" onClick={() => void copy(code, 'Code')}>
              Copy code
            </Button>
            <Button variant="secondary" onClick={() => void copy(roomLink(code), 'Link')}>
              Copy link
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onLeave}>
          Leave room
        </Button>
      </div>
    </main>
  )
}

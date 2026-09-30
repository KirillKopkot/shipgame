import { useState } from 'react'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import type { ProState } from '../pro/storage'

interface ProModalProps {
  pro: ProState
  onChange: (next: ProState) => void
  onClose: () => void
}

/** Demo of a paid plan: no payment and no card fields, "Activate" only sets a flag. */
export function ProModal({ pro, onChange, onClose }: ProModalProps) {
  const [justActivated, setJustActivated] = useState(false)

  function activate() {
    onChange({ active: true, theme: true })
    setJustActivated(true)
  }

  function deactivate() {
    onChange({ ...pro, active: false })
    onClose()
  }

  let body
  if (justActivated) {
    body = (
      <>
        <p className="bs-body modal__text">You now have access to the new theme</p>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </>
    )
  } else if (pro.active) {
    body = (
      <>
        <p className="bs-body modal__text">Pro is active</p>
        <Button variant="secondary" onClick={deactivate}>
          Deactivate (demo)
        </Button>
      </>
    )
  } else {
    body = (
      <>
        <ul className="modal__list">
          <li>New ship and board theme</li>
          <li>Extended stats (coming soon)</li>
        </ul>
        <Button variant="primary" onClick={activate}>
          Activate Pro (demo)
        </Button>
      </>
    )
  }

  return (
    <Modal labelledBy="pro-title" onClose={onClose}>
      <h2 id="pro-title" className="bs-h2 modal__title">
        Salvo Pro
      </h2>
      <p className="modal__demo">Demo mode: no real payment</p>
      {body}
    </Modal>
  )
}

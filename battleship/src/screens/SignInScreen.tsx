import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'

interface SignInScreenProps {
  onBack: () => void
  onGuest: () => void
}

/** Placeholder: looks like the design, accounts are not built yet. */
export function SignInScreen({ onBack, onGuest }: SignInScreenProps) {
  return (
    <main className="bs-screen screen">
      <ScreenHeader
        title="Account"
        onBack={onBack}
        right={<span className="bs-chip bs-chip--accent">Coming soon</span>}
      />
      <div className="screen__intro">
        <h1 className="bs-h1">Welcome back</h1>
        <p className="bs-body">Sign in to keep your record on every device.</p>
      </div>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="bs-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="bs-input"
            type="email"
            placeholder="captain@example.com"
            autoComplete="email"
            readOnly
          />
        </div>
        <div>
          <label className="bs-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="bs-input"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="current-password"
            readOnly
          />
        </div>
        <Button variant="primary" type="submit">
          Sign in
        </Button>
        <div className="divider" role="separator">
          <span>New here?</span>
        </div>
        <Button variant="secondary">Create account</Button>
      </form>
      <div className="screen__actions">
        <Button variant="ghost" onClick={onGuest}>
          Play as Guest
        </Button>
      </div>
    </main>
  )
}

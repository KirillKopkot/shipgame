import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ScreenHeader } from '../components/ScreenHeader'
import { Toggle } from '../components/Toggle'
import type { Settings } from '../game/storage'

interface SettingsScreenProps {
  settings: Settings
  onChange: (settings: Settings) => void
  onBack: () => void
}

export function SettingsScreen({ settings, onChange, onBack }: SettingsScreenProps) {
  return (
    <main className="bs-screen screen">
      <ScreenHeader title="Preferences" onBack={onBack} />
      <h1 className="bs-h1 screen__heading">Settings</h1>
      <div className="screen__list">
        <Card>
          <div className="setting">
            <div>
              <h2 className="setting__name">Music</h2>
              <p className="bs-body">Ambient sonar loop</p>
            </div>
            <Toggle
              label="Music"
              checked={settings.music}
              onChange={(music) => onChange({ ...settings, music })}
            />
          </div>
        </Card>
        <Card>
          <div className="setting">
            <div>
              <h2 className="setting__name">Sound</h2>
              <p className="bs-body">Shots, splashes and alerts</p>
            </div>
            <Toggle
              label="Sound"
              checked={settings.sound}
              onChange={(sound) => onChange({ ...settings, sound })}
            />
          </div>
        </Card>
      </div>
      <div className="screen__actions">
        <Button variant="primary" onClick={onBack}>
          Done
        </Button>
      </div>
    </main>
  )
}

import { useState } from 'react'
import { loadSavedGame, loadSettings, saveSettings } from './game/storage'
import type { Settings } from './game/storage'
import type { Board, Difficulty } from './game/types'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MultiplayerScreen } from './screens/MultiplayerScreen'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { PlacementScreen } from './screens/PlacementScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SignInScreen } from './screens/SignInScreen'
import { StartScreen } from './screens/StartScreen'

export type Screen =
  | 'start'
  | 'home'
  | 'difficulty'
  | 'placement'
  | 'game'
  | 'result'
  | 'settings'
  | 'multiplayer'
  | 'signin'

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  // Screens we can go back to (top = previous screen).
  const [history, setHistory] = useState<Screen[]>([])
  const [isGuest, setIsGuest] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [savedGame] = useState(loadSavedGame)
  // The player's placed fleet, set by "Battle!" and read by the game screen.
  const [playerFleet, setPlayerFleet] = useState<Board | null>(null)

  function go(next: Screen) {
    setHistory((h) => [...h, screen])
    setScreen(next)
  }

  /** Moves to a screen without keeping the current one in history (e.g. after leaving Start). */
  function replace(next: Screen) {
    setScreen(next)
  }

  function back() {
    const previous = history[history.length - 1] ?? 'home'
    setHistory((h) => h.slice(0, -1))
    setScreen(previous)
  }

  function playAsGuest() {
    setIsGuest(true)
    setHistory([])
    replace('home')
  }

  function changeSettings(next: Settings) {
    setSettings(next)
    saveSettings(next)
  }

  switch (screen) {
    case 'start':
      return <StartScreen onGuest={playAsGuest} onSignIn={() => go('signin')} />
    case 'signin':
      return <SignInScreen onBack={back} onGuest={playAsGuest} />
    case 'home':
      return (
        <HomeScreen
          isGuest={isGuest}
          savedGame={savedGame}
          onContinue={() => go('game')}
          onSinglePlayer={() => go('difficulty')}
          onMultiplayer={() => go('multiplayer')}
          onSettings={() => go('settings')}
        />
      )
    case 'difficulty':
      return (
        <DifficultyScreen
          onBack={back}
          onSelect={(d) => {
            setDifficulty(d)
            go('placement')
          }}
        />
      )
    case 'settings':
      return <SettingsScreen settings={settings} onChange={changeSettings} onBack={back} />
    case 'multiplayer':
      return <MultiplayerScreen onBack={back} />
    case 'placement':
      return (
        <PlacementScreen
          difficulty={difficulty}
          onBack={back}
          onSettings={() => go('settings')}
          onBattle={(fleet) => {
            setPlayerFleet(fleet)
            go('game')
          }}
        />
      )
    case 'game':
      return (
        <PlaceholderScreen
          title={`Game · ${playerFleet?.ships.length ?? 0} ships placed`}
          onBack={back}
        />
      )
    case 'result':
      return <PlaceholderScreen title="Result" onBack={back} />
  }
}

export default App

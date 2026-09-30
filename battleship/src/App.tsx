import { useCallback, useState } from 'react'
import { createGame } from './game/match'
import { loadSavedGame, loadSettings, saveGame, saveSettings } from './game/storage'
import type { Settings } from './game/storage'
import type { Difficulty, GameState } from './game/types'
import { DifficultyScreen } from './screens/DifficultyScreen'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MultiplayerScreen } from './screens/MultiplayerScreen'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { PlacementScreen } from './screens/PlacementScreen'
import { ResultScreen } from './screens/ResultScreen'
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
  // The current match: restored from localStorage, kept there while it is in progress.
  const [game, setGame] = useState<GameState | null>(loadSavedGame)

  const updateGame = useCallback((next: GameState) => {
    setGame(next)
    saveGame(next) // a finished match deletes its save
  }, [])

  function go(next: Screen) {
    setHistory((h) => [...h, screen])
    setScreen(next)
  }

  /** Moves to a screen without keeping the current one in history (e.g. after leaving Start). */
  const replace = useCallback((next: Screen) => {
    setScreen(next)
  }, [])

  function back() {
    const previous = history[history.length - 1] ?? 'home'
    setHistory((h) => h.slice(0, -1))
    setScreen(previous)
  }

  function goHome() {
    setHistory([])
    setScreen('home')
  }

  function playAsGuest() {
    setIsGuest(true)
    goHome()
  }

  function changeSettings(next: Settings) {
    setSettings(next)
    saveSettings(next)
  }

  function rematch() {
    if (!game) return goHome()
    setDifficulty(game.difficulty)
    setGame(null)
    setHistory(['home', 'difficulty'])
    setScreen('placement')
  }

  const finishGame = useCallback(() => replace('result'), [replace])

  switch (screen) {
    case 'start':
      return <StartScreen onGuest={playAsGuest} onSignIn={() => go('signin')} />
    case 'signin':
      return <SignInScreen onBack={back} onGuest={playAsGuest} />
    case 'home':
      return (
        <HomeScreen
          isGuest={isGuest}
          savedGame={game?.phase === 'playing' ? game : null}
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
            updateGame(createGame(fleet, difficulty))
            go('game')
          }}
        />
      )
    case 'game':
      if (!game) return <PlaceholderScreen title="Game" onBack={goHome} />
      return (
        <GameScreen
          game={game}
          onUpdate={updateGame}
          onFinish={finishGame}
          onBack={goHome}
          onSettings={() => go('settings')}
        />
      )
    case 'result':
      if (!game || game.phase !== 'finished') return <PlaceholderScreen title="Result" onBack={goHome} />
      return <ResultScreen game={game} onRematch={rematch} onMenu={goHome} />
  }
}

export default App

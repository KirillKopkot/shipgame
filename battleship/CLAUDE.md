# Battleship

Web app: the Battleship (Sea Battle) game.

## Stack

- React + Vite + TypeScript
- Plain CSS (no Tailwind)
- Tests: vitest

## Project structure

- `src/game/` — game logic in pure TypeScript. No React imports here.
- `src/screens/` — screen-level UI components.
- `src/components/` — reusable UI components.

## Rules

- Game logic lives only in `src/game/` and must not import React.
- UI code lives only in `src/screens/` and `src/components/`.
- Game state (the current match) is persisted in `localStorage`.
- Mobile-first layout: write base styles for small screens, then enhance with `min-width` media queries.
- All UI text is in English.
- Styling is plain CSS only. Do not add Tailwind.

## Screens

1. **Start** — choose guest or login.
2. **Main** — singleplayer, multiplayer, settings.
3. **Difficulty selection** — easy, medium, hard.
4. **Ship placement** — player arranges ships.
5. **Game** — the match itself.
6. **Result** — outcome of the match.
7. **Settings** — music and sounds toggles.

## Workflow

At the end of every task, run:

```bash
npm run build
npm test
```

Fix any failures before considering the task done.
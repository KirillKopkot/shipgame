import { useState } from 'react'
import { Board } from '../components/Board'
import { boardToCells } from '../components/cellView'
import { Button } from '../components/Button'
import { Hint } from '../components/Hint'
import { IconButton } from '../components/IconButton'
import { BackIcon, LogoMark, SunIcon } from '../components/Icons'
import { ShipChip } from '../components/ShipChip'
import { createEmptyBoard, placeShip, randomPlacement, removeShip } from '../game/board'
import { isFleetComplete, previewShip, remainingBySize, shipIdAt } from '../game/placement'
import type { Board as GameBoard, Orientation } from '../game/types'

interface PlacementScreenProps {
  /** Chip next to the title on phones, e.g. "Medium". */
  chipLabel: string
  /** Chip in the desktop header, e.g. "vs computer · medium". */
  deskChipLabel: string
  /** Text of the confirm button (default "Battle!"). */
  submitLabel?: string
  /** Disables the confirm button while something is being saved. */
  busy?: boolean
  /** A problem to show instead of the usual hint (e.g. saving failed). */
  error?: string | null
  onBack: () => void
  onSettings: () => void
  onSubmit: (fleet: GameBoard) => void
}

const KINDS = [
  { size: 4, name: 'Battleship' },
  { size: 3, name: 'Cruiser' },
  { size: 2, name: 'Destroyer' },
  { size: 1, name: 'Scout' },
] as const

/** Size of the largest ship kind that still has ships to place. */
function nextSize(left: Record<number, number>): number | null {
  return KINDS.find((k) => left[k.size] > 0)?.size ?? null
}

export function PlacementScreen({
  chipLabel,
  deskChipLabel,
  submitLabel = 'Battle!',
  busy = false,
  error = null,
  onBack,
  onSettings,
  onSubmit,
}: PlacementScreenProps) {
  const [board, setBoard] = useState<GameBoard>(createEmptyBoard)
  const [selected, setSelected] = useState<number | null>(4)
  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null)
  const [failed, setFailed] = useState(false)

  const left = remainingBySize(board)
  const complete = isFleetComplete(board)
  const selectedKind = KINDS.find((k) => k.size === selected)

  // Preview only over free water: over a placed ship a tap removes it instead.
  const preview =
    selected !== null && aim && shipIdAt(board, aim.x, aim.y) === null
      ? previewShip(board, aim.x, aim.y, selected, orientation)
      : null

  const cells = boardToCells(board, true)
  if (preview) {
    for (const c of preview.cells) cells[c.y][c.x] = preview.valid ? 'preview-valid' : 'preview-invalid'
  }

  function handleCell(x: number, y: number) {
    const id = shipIdAt(board, x, y)
    if (id !== null) {
      const ship = board.ships.find((s) => s.id === id)
      setBoard(removeShip(board, id))
      if (ship) setSelected(ship.size)
      setFailed(false)
      return
    }
    if (selected === null) return
    const next = placeShip(board, x, y, selected, orientation)
    if (!next) {
      setFailed(true)
      return
    }
    setFailed(false)
    setBoard(next)
    const remaining = remainingBySize(next)
    if (remaining[selected] === 0) setSelected(nextSize(remaining))
  }

  function handleAim(cell: { x: number; y: number } | null) {
    setAim(cell)
    setFailed(false)
  }

  function random() {
    setBoard(randomPlacement())
    setSelected(null)
    setFailed(false)
  }

  function clear() {
    setBoard(createEmptyBoard())
    setSelected(4)
    setOrientation('horizontal')
    setFailed(false)
  }

  const tap = (
    <>
      <b className="ui-touch-only">Tap</b>
      <b className="ui-mouse-only">Click</b>
    </>
  )

  let hint
  if (error) {
    hint = <Hint tone="bad">{error}</Hint>
  } else if (failed || (preview && !preview.valid)) {
    hint = <Hint tone="bad">Ships can’t touch or overlap.</Hint>
  } else if (selectedKind) {
    hint = (
      <Hint tone="ok">
        {selectedKind.name} selected. {tap} the grid to place it.
      </Hint>
    )
  } else if (complete) {
    hint = <Hint tone="ok">Fleet ready. Press {submitLabel}</Hint>
  } else {
    hint = <Hint tone="ok">Pick a ship from the list.</Hint>
  }

  return (
    <main className="bs-screen screen placement">
      <header className="placement__bar">
        <IconButton label="Back" onClick={onBack}>
          <BackIcon />
        </IconButton>
        <h1 className="bs-h1 placement__title">Place your fleet</h1>
        <span className="bs-chip">{chipLabel}</span>
      </header>
      <header className="placement__desk-bar">
        <LogoMark />
        <span className="home__brand">Salvo</span>
        <span className="bs-chip placement__desk-chip">{deskChipLabel}</span>
        <IconButton label="Settings" onClick={onSettings}>
          <SunIcon />
        </IconButton>
      </header>

      <div className="placement__body">
        <p className="bs-eyebrow placement__step">Step 1 of 2</p>
        <h1 className="placement__desk-title">Place your fleet</h1>
        <div className="placement__hint">{hint}</div>
        <div className="placement__board">
          <Board cells={cells} onCellClick={handleCell} onCellAim={handleAim} />
        </div>
        <div className="placement__ships">
          {KINDS.map((k) => (
            <ShipChip
              key={k.size}
              name={k.name}
              size={k.size}
              left={left[k.size]}
              selected={selected === k.size}
              onClick={() => {
                setSelected(k.size)
                setFailed(false)
              }}
            />
          ))}
        </div>
        <div className="placement__tools">
          <Button
            size="sm"
            disabled={selected === null}
            onClick={() => setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
          >
            Rotate
          </Button>
          <Button size="sm" onClick={random}>
            Random
          </Button>
          <Button size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
        <div className="placement__battle">
          <Button
            variant={complete && !busy ? 'primary' : 'disabled'}
            size="lg"
            onClick={() => onSubmit(board)}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </main>
  )
}

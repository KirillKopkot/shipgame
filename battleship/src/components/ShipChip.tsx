interface ShipChipProps {
  name: string
  size: number
  left: number
  selected: boolean
  onClick: () => void
}

export function ShipChip({ name, size, left, selected, onClick }: ShipChipProps) {
  const done = left === 0
  const classes = ['bs-ship', selected && 'is-selected', done && 'is-done'].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={done}
      aria-pressed={selected}
      aria-label={`${name}, ${size} cells, ${done ? 'done' : `${left} left`}`}
    >
      <span className="bs-ship__row">
        <span className="bs-ship__name">{name}</span>
        <span className="bs-ship__count">{done ? 'Done' : `${left} left`}</span>
      </span>
      <span className="bs-hull" aria-hidden="true">
        {Array.from({ length: size }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </button>
  )
}

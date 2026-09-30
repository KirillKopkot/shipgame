interface FleetPipsProps {
  ships: { size: number; sunk: boolean }[]
}

/** One pip per ship, as long as the ship; dark once sunk. */
export function FleetPips({ ships }: FleetPipsProps) {
  return (
    <span className="bs-pips" aria-hidden="true">
      {ships.map((s, i) => (
        <span
          key={i}
          className={s.sunk ? 'bs-pip is-sunk' : 'bs-pip'}
          style={{ width: `calc(var(--bs-space-1) * 1.5 * ${s.size})` }}
        />
      ))}
    </span>
  )
}

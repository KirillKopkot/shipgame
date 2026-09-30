interface TurnIndicatorProps {
  turn: 'you' | 'enemy'
}

export function TurnIndicator({ turn }: TurnIndicatorProps) {
  return (
    <div className={`bs-turn bs-turn--${turn}`} role="status">
      <span className="bs-turn__dot" aria-hidden="true" />
      {turn === 'you' ? 'Your turn' : 'Enemy turn'}
    </div>
  )
}

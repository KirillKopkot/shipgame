interface ToggleProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      className="bs-toggle"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  )
}

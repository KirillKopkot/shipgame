interface ToggleProps {
  checked: boolean
  label: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, label, disabled = false, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      className="bs-toggle"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  )
}

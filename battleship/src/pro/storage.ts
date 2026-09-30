export const PRO_KEY = 'battleship:pro'
/** Bump when the stored shape changes; other versions are discarded. */
export const PRO_VERSION = 1

/** Demo only: there is no payment, "active" is just a flag in localStorage. */
export interface ProState {
  active: boolean
  /** The player's choice for the Pro theme; it only takes effect while Pro is active. */
  theme: boolean
}

export const DEFAULT_PRO: ProState = { active: false, theme: false }

/** Parses the stored value. Anything unreadable, of another version or of the wrong shape gives null. */
export function parseProState(raw: string | null): ProState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as { version?: unknown; active?: unknown; theme?: unknown }
    if (data.version === PRO_VERSION && typeof data.active === 'boolean' && typeof data.theme === 'boolean') {
      return { active: data.active, theme: data.theme }
    }
  } catch {
    // corrupted value: treat as missing
  }
  return null
}

/** True when the Pro theme should be shown. */
export function isThemeOn(state: ProState): boolean {
  return state.active && state.theme
}

function clearProState(): void {
  try {
    localStorage.removeItem(PRO_KEY)
  } catch {
    // storage unavailable
  }
}

/** Loads the saved state. An invalid value is deleted and the default is returned. */
export function loadProState(): ProState {
  let raw: string | null
  try {
    raw = localStorage.getItem(PRO_KEY)
  } catch {
    return DEFAULT_PRO
  }
  if (raw === null) return DEFAULT_PRO
  const state = parseProState(raw)
  if (!state) clearProState()
  return state ?? DEFAULT_PRO
}

export function saveProState(state: ProState): void {
  try {
    localStorage.setItem(PRO_KEY, JSON.stringify({ version: PRO_VERSION, ...state }))
  } catch {
    // storage unavailable: Pro lasts only for this session
  }
}

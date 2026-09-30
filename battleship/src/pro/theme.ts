/** Turns the Pro theme on or off by setting data-theme="pro" on <html>. */
export function applyTheme(on: boolean): void {
  const root = document.documentElement
  if (on) root.setAttribute('data-theme', 'pro')
  else root.removeAttribute('data-theme')
}

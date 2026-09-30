/**
 * Start-screen illustration, inlined from src/assets/start-hero.svg so CSS can style it.
 * The SVG has no ids (no gradients, clip paths or masks), so several copies can coexist.
 * Layers, back to front: dotted path, blue ball, red ball, smoke and funnel, cabin,
 * cannon, mast with flag, red hull, front wave.
 */
export function StartHero() {
  return (
    <svg
      className="start-hero"
      xmlns="http://www.w3.org/2000/svg"
      width="358"
      height="270"
      viewBox="0 0 358 290"
      fill="none"
      role="img"
      aria-label="Cartoon ship with a blue and a red cannonball mascot"
    >
      <path d="M232 150Q262 70 298 76" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 13" />

      <path d="M312 30q10-14 26-8" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />
      <circle cx="340" cy="22" r="8" fill="#FFC93C" stroke="#1E3A66" strokeWidth="3.5" />
      <circle cx="304" cy="72" r="30" fill="#2F8FE6" stroke="#1E3A66" strokeWidth="6" />
      <circle cx="304" cy="70" r="15" fill="#fff" stroke="#1E3A66" strokeWidth="4" />
      <circle cx="308" cy="72" r="7" fill="#1E3A66" />
      <path d="M284 58q6-9 16-6" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".6" />

      <path d="M40 60q8-14 22-8" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />
      <circle cx="66" cy="50" r="7" fill="#C9D8E8" stroke="#1E3A66" strokeWidth="3.5" />
      <circle cx="44" cy="92" r="26" fill="#EF4B3F" stroke="#1E3A66" strokeWidth="6" />
      <circle cx="44" cy="90" r="13" fill="#fff" stroke="#1E3A66" strokeWidth="4" />
      <circle cx="40" cy="93" r="6" fill="#1E3A66" />
      <path d="M28 76l24 6" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />

      <path
        d="M198 66a14 14 0 1 1 4-27 12 12 0 1 1 22 12 10 10 0 0 1-12 16Z"
        fill="#fff"
        stroke="#1E3A66"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="168" y="86" width="34" height="42" rx="9" fill="#FFC93C" stroke="#1E3A66" strokeWidth="6" />
      <path d="M170 102H200" stroke="#1E3A66" strokeWidth="5" />

      <rect x="138" y="124" width="96" height="56" rx="14" fill="#fff" stroke="#1E3A66" strokeWidth="6" />
      <circle cx="168" cy="152" r="10" fill="#6DCBF6" stroke="#1E3A66" strokeWidth="4" />
      <circle cx="206" cy="152" r="10" fill="#6DCBF6" stroke="#1E3A66" strokeWidth="4" />

      <rect
        x="262"
        y="146"
        width="48"
        height="20"
        rx="10"
        fill="#26437A"
        stroke="#1E3A66"
        strokeWidth="5"
        transform="rotate(-28 262 156)"
      />

      <path d="M96 122V178" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />
      <path d="M96 122L126 133L96 146Z" fill="#6FD04A" stroke="#1E3A66" strokeWidth="4" strokeLinejoin="round" />

      <path
        d="M62 178H298L268 238Q264 246 254 246H106Q96 246 92 238Z"
        fill="#EF4B3F"
        stroke="#1E3A66"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M82 202H278" stroke="#fff" strokeWidth="9" strokeLinecap="round" />

      <path
        d="M12 240q22-28 44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0V290H12Z"
        fill="#4FB4EA"
        stroke="#1E3A66"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

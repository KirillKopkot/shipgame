/**
 * Result-screen mascots, inlined from src/assets/victory-art.svg and defeat-art.svg
 * so CSS can size them. The SVGs have no ids, so nothing can clash.
 */
export function VictoryArt() {
  return (
    <svg
      className="result-art"
      xmlns="http://www.w3.org/2000/svg"
      width="230"
      height="210"
      viewBox="0 0 230 210"
      fill="none"
      role="img"
      aria-label="Happy blue cannonball celebrating victory"
    >
      <circle cx="115" cy="108" r="96" fill="#fff" opacity=".55" />
      <circle cx="115" cy="108" r="76" fill="#FFF1B8" stroke="#1E3A66" strokeWidth="5" />
      <path d="M130 62q12-18 32-10" stroke="#1E3A66" strokeWidth="6" strokeLinecap="round" />
      <circle cx="164" cy="48" r="9" fill="#FFC93C" stroke="#1E3A66" strokeWidth="4" />
      <circle cx="115" cy="116" r="52" fill="#2F8FE6" stroke="#1E3A66" strokeWidth="6" />
      <path d="M82 100q8-16 26-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      <circle cx="115" cy="108" r="24" fill="#fff" stroke="#1E3A66" strokeWidth="5" />
      <circle cx="121" cy="111" r="11" fill="#1E3A66" />
      <circle cx="125" cy="106" r="3.5" fill="#fff" />
      <path d="M96 142q19 18 38 0" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 40l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="#FFC93C" stroke="#1E3A66" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M196 132l4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#FF8A1F" stroke="#1E3A66" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M198 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#6FD04A" stroke="#1E3A66" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="120" width="16" height="8" rx="3" fill="#EF4B3F" stroke="#1E3A66" strokeWidth="3" transform="rotate(-25 26 124)" />
      <rect x="205" y="80" width="16" height="8" rx="3" fill="#fff" stroke="#1E3A66" strokeWidth="3" transform="rotate(30 213 84)" />
    </svg>
  )
}

export function DefeatArt() {
  return (
    <svg
      className="result-art"
      xmlns="http://www.w3.org/2000/svg"
      width="230"
      height="210"
      viewBox="0 0 230 210"
      fill="none"
      role="img"
      aria-label="Sad red cannonball after a defeat"
    >
      <circle cx="115" cy="108" r="96" fill="#fff" opacity=".55" />
      <circle cx="115" cy="108" r="76" fill="#DCE8F3" stroke="#1E3A66" strokeWidth="5" />
      <path d="M130 62q12-18 32-10" stroke="#1E3A66" strokeWidth="6" strokeLinecap="round" />
      <circle cx="164" cy="48" r="9" fill="#C9D8E8" stroke="#1E3A66" strokeWidth="4" />
      <circle cx="115" cy="116" r="52" fill="#EF4B3F" stroke="#1E3A66" strokeWidth="6" />
      <path d="M82 100q8-16 26-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".45" />
      <circle cx="115" cy="108" r="24" fill="#fff" stroke="#1E3A66" strokeWidth="5" />
      <circle cx="113" cy="116" r="10" fill="#1E3A66" />
      <path d="M91 106a24 24 0 0 1 48 0Z" fill="#EF4B3F" stroke="#1E3A66" strokeWidth="5" strokeLinejoin="round" />
      <path d="M97 148q18-16 36 0" stroke="#1E3A66" strokeWidth="5" strokeLinecap="round" />
      <path d="M150 116q9 12 0 19q-9-7 0-19Z" fill="#6DCBF6" stroke="#1E3A66" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M36 44l14 14M50 44L36 58" stroke="#1E3A66" strokeWidth="6" strokeLinecap="round" />
      <path d="M186 150l12 12M198 150l-12 12" stroke="#1E3A66" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

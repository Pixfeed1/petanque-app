type Variant = 'acier' | 'bronze' | 'cochonnet' | 'rouge' | 'vert'

interface Palette {
  light: string
  dark: string
}

const palettes: Record<Variant, Palette> = {
  acier:     { light: '#d6dae0', dark: '#3a3f48' },
  bronze:    { light: '#e8c890', dark: '#5a3e1a' },
  cochonnet: { light: '#f3b86a', dark: '#5a3408' },
  rouge:     { light: '#e87263', dark: '#4a0d05' },
  vert:      { light: '#6a8a4a', dark: '#173404' },
}

interface BouleSvgProps {
  size?: number
  variant?: Variant
  stries?: boolean
  reflect?: boolean
  spinning?: boolean
  className?: string
}

let bouleIdCounter = 0

export function BouleSvg({
  size = 60,
  variant = 'acier',
  stries = true,
  reflect = true,
  spinning = false,
  className = '',
}: BouleSvgProps) {
  const p = palettes[variant]
  const id = `b${++bouleIdCounter}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`${spinning ? 'animate-spin-slow' : ''} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`grad-${id}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="30" cy="30" r="28" />
        </clipPath>
      </defs>

      <circle cx="30" cy="30" r="28" fill={`url(#grad-${id})`} />

      {stries && (
        <g clipPath={`url(#clip-${id})`} stroke={p.dark} strokeLinecap="round" fill="none">
          <line x1="0" y1="22" x2="60" y2="22" strokeWidth="0.6" opacity="0.45" />
          <line x1="0" y1="30" x2="60" y2="30" strokeWidth="0.7" opacity="0.55" />
          <line x1="0" y1="38" x2="60" y2="38" strokeWidth="0.6" opacity="0.45" />
          <ellipse cx="30" cy="30" rx="6" ry="28" strokeWidth="0.55" opacity="0.4" />
          <ellipse cx="30" cy="30" rx="14" ry="28" strokeWidth="0.5" opacity="0.32" />
          <ellipse cx="30" cy="30" rx="22" ry="28" strokeWidth="0.45" opacity="0.22" />
        </g>
      )}

      {reflect && (
        <ellipse
          cx="20"
          cy="17"
          rx="8.5"
          ry="5"
          fill="white"
          opacity="0.18"
          transform="rotate(-25 20 17)"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}

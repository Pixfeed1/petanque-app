interface BouleSvgProps {
  size?: number
  variant?: 'acier' | 'bronze' | 'vert' | 'cochonnet' | 'rouge'
  stries?: boolean
  spinning?: boolean
  className?: string
}

const palettes = {
  acier:     { light: '#dee5ec', mid: '#8b97a8', dark: '#3d4856' },
  bronze:    { light: '#e6d4a8', mid: '#a08350', dark: '#3d2f15' },
  vert:      { light: '#c0e090', mid: '#5d8a35', dark: '#1a3015' },
  cochonnet: { light: '#f5d6a0', mid: '#c8985f', dark: '#5a3818' },
  rouge:     { light: '#f4a8a8', mid: '#a23030', dark: '#3a0a0a' },
}

export function BouleSvg({
  size = 60,
  variant = 'acier',
  stries = true,
  spinning = false,
  className = '',
}: BouleSvgProps) {
  const p = palettes[variant]
  const id = `boule-${variant}-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`${spinning ? 'animate-spin-slow' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="30%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="55%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="30" cy="30" r="28" />
        </clipPath>
      </defs>
      <circle cx="30" cy="30" r="28" fill={`url(#${id})`} />
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
      <ellipse cx="22" cy="20" rx="6" ry="3" fill="#fff" opacity="0.4" />
    </svg>
  )
}

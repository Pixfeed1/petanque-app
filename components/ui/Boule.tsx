'use client'

import dynamic from 'next/dynamic'
import { BouleSvg } from './BouleSvg'

const Boule3D = dynamic(() => import('./Boule3D').then((m) => m.Boule3D), {
  ssr: false,
  loading: () => null,
})

interface BouleProps {
  size?: number
  variant?: 'acier' | 'bronze'
  mode?: '3d' | 'svg'
  rotateSpeed?: number
  className?: string
}

export function Boule({
  size = 120,
  variant = 'acier',
  mode = 'svg',
  rotateSpeed = 0.4,
  className = '',
}: BouleProps) {
  if (mode === '3d') {
    return (
      <Boule3D
        size={size}
        variant={variant}
        rotateSpeed={rotateSpeed}
        className={className}
      />
    )
  }
  return <BouleSvg size={size} variant={variant} stries className={className} />
}

export { BouleSvg } from './BouleSvg'

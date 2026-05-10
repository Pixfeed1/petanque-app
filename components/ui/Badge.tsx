import { ReactNode } from 'react'
import { BouleSvg } from './BouleSvg'

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  withBoule?: boolean
  className?: string
}

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-petanque-sable text-petanque-bois border-petanque-sable-bord',
  success: 'bg-petanque-vert-pale text-petanque-vert border-petanque-vert/30',
  warning: 'bg-petanque-cochonnet-pale text-petanque-bois border-petanque-cochonnet/40',
  danger:  'bg-petanque-rouge/10 text-petanque-rouge border-petanque-rouge/30',
  info:    'bg-blue-50 text-blue-800 border-blue-300',
}

const bouleVariant: Record<Variant, 'acier' | 'vert' | 'cochonnet' | 'rouge' | 'acier'> = {
  neutral: 'acier',
  success: 'vert',
  warning: 'cochonnet',
  danger: 'rouge',
  info: 'acier',
}

export function Badge({ variant = 'neutral', children, withBoule = true, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium ${withBoule ? 'pl-1 pr-3 py-0.5' : 'px-2.5 py-1'} ${variantClasses[variant]} ${className}`}
    >
      {withBoule && <BouleSvg size={16} variant={bouleVariant[variant]} stries />}
      {children}
    </span>
  )
}

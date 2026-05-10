import { ReactNode } from 'react'

interface StatProps {
  label: string
  value: ReactNode
  suffix?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-lg md:text-xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-4xl md:text-5xl',
}

export function Stat({ label, value, suffix, size = 'md', className = '' }: StatProps) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.12em] mb-1">
        {label}
      </p>
      <p className={`font-mono font-medium leading-none text-petanque-vert-fonce ${sizes[size]}`}>
        {value}
        {suffix && (
          <span className="text-petanque-bois text-[60%] ml-0.5 font-sans">{suffix}</span>
        )}
      </p>
    </div>
  )
}

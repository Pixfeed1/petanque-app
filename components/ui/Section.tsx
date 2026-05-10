import { ReactNode } from 'react'

type Ambiance = 'public' | 'interne' | 'transparent'
type Spacing = 'tight' | 'normal' | 'loose'

interface SectionProps {
  ambiance?: Ambiance
  spacing?: Spacing
  children: ReactNode
  className?: string
  id?: string
  as?: 'section' | 'div' | 'header' | 'footer' | 'main'
}

const ambianceClasses: Record<Ambiance, string> = {
  public: 'bg-gradient-to-br from-petanque-vert-pale/40 via-white to-petanque-cochonnet-pale/30',
  interne: 'bg-petanque-sable-pale',
  transparent: '',
}

const spacingClasses: Record<Spacing, string> = {
  tight: 'py-10 md:py-14',
  normal: 'py-16 md:py-24',
  loose: 'py-24 md:py-32',
}

export function Section({
  ambiance = 'transparent',
  spacing = 'normal',
  as: Tag = 'section',
  children,
  className = '',
  id,
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={`relative ${ambianceClasses[ambiance]} ${spacingClasses[spacing]} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </Tag>
  )
}

'use client'

import { FadeIn } from '@/components/ui'

interface LegalSectionProps {
  id?: string
  num?: string
  title: string
  delay?: number
  children: React.ReactNode
}

export default function LegalSection({ id, num, title, delay = 60, children }: LegalSectionProps) {
  return (
    <FadeIn delay={delay}>
      <section id={id} className="pt-8 mt-8 first:pt-0 first:mt-0 border-t border-petanque-sable-bord/50 first:border-t-0">
        {num && <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{num}</p>}
        <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-4 tracking-tight">{title}</h2>
        <div className="space-y-3">
          {children}
        </div>
      </section>
    </FadeIn>
  )
}

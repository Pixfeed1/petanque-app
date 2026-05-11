'use client'

import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  backHref?: string
  backLabel?: string
  title: string
  actions?: React.ReactNode
  maxWidth?: string
}

export default function PageHeader({ backHref, backLabel = 'Retour', title, actions, maxWidth = 'max-w-5xl' }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex items-center justify-between gap-4 h-14">
          <button
            onClick={() => backHref && router.push(backHref)}
            className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
          >
            <span>←</span>
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
          <span className="font-mono text-xs text-petanque-bois">{title}</span>
          <div className="flex items-center gap-2 flex-shrink-0">{actions || <span></span>}</div>
        </div>
      </div>
    </header>
  )
}

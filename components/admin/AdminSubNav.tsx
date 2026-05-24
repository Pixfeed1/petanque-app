'use client'

export interface AdminSubNavSection {
  id: string
  label: string
  meta?: string
  isActive: boolean
  onClick: () => void
}

interface AdminSubNavProps {
  sections: AdminSubNavSection[]
}

export default function AdminSubNav({ sections }: AdminSubNavProps) {
  return (
    <nav className="sticky top-14 z-40 bg-petanque-sable border-b border-petanque-sable-bord/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-10 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={s.onClick}
              className={'text-xs whitespace-nowrap py-2 transition-colors relative ' + (
                s.isActive
                  ? 'text-petanque-vert-fonce font-medium'
                  : 'text-petanque-bois hover:text-petanque-vert-fonce'
              )}
            >
              {s.label}
              {s.meta && <span className="text-petanque-sable-bord ml-1.5 font-mono">{s.meta}</span>}
              {s.isActive && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-petanque-vert-fonce" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

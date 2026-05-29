'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type ViewRole = 'organisateur' | 'joueur' | 'spectateur'

interface Tab {
  id: string
  label: string
  kind: 'section' | 'page'
  href?: string
}

interface TournamentSubNavProps {
  tournoiId: string
  currentPage: 'apercu' | 'bracket' | 'export'
  currentSection?: string
  onSectionChange?: (sectionId: string) => void
  userPlan?: string
  baseRole?: ViewRole
  viewRole?: ViewRole
  setViewRole?: (role: ViewRole) => void
  isPreviewMode?: boolean
}

export default function TournamentSubNav({
  tournoiId,
  currentPage,
  currentSection,
  onSectionChange,
  userPlan = 'free',
  baseRole = 'organisateur',
  viewRole = 'organisateur',
  setViewRole,
  isPreviewMode = false,
}: TournamentSubNavProps) {
  const router = useRouter()
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const tabs: Tab[] = [
    { id: 'apercu', label: 'Aperçu', kind: 'section' },
    { id: 'matchs', label: 'Tous les matchs', kind: 'section' },
    { id: 'classement', label: 'Classement', kind: 'section' },
    { id: 'equipes', label: 'Équipes', kind: 'section' },
    { id: 'bracket', label: 'Phase finale', kind: 'page', href: `/tournoi/${tournoiId}/bracket` },
    ...(userPlan === 'club' ? [{ id: 'stats', label: 'Stats', kind: 'section' as const }] : []),
    { id: 'export', label: 'Export', kind: 'page', href: `/tournoi/${tournoiId}/export` },
  ]

  const handleClick = (tab: Tab) => {
    if (tab.kind === 'page') {
      router.push(tab.href!)
    } else if (currentPage === 'apercu') {
      onSectionChange?.(tab.id)
    } else {
      router.push(`/tournoi/${tournoiId}`)
    }
  }

  const isActive = (tab: Tab): boolean => {
    if (tab.kind === 'page') return currentPage === tab.id
    return currentPage === 'apercu' && currentSection === tab.id
  }

  return (
    <nav className="sticky top-14 z-40 bg-petanque-sable border-b border-petanque-sable-bord/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-10">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => {
              const active = isActive(tab)
              return (
                <button
                  key={tab.id}
                  onClick={() => handleClick(tab)}
                  className={`text-xs whitespace-nowrap py-2 transition-colors relative ${
                    active
                      ? 'text-petanque-vert-fonce font-medium'
                      : 'text-petanque-bois hover:text-petanque-vert-fonce'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-petanque-vert"></span>
                  )}
                </button>
              )
            })}
          </div>
          {baseRole === 'organisateur' && setViewRole && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white border rounded-full text-[11px] transition-colors ${
                  isPreviewMode
                    ? 'border-petanque-cochonnet text-petanque-cochonnet-fonce'
                    : 'border-petanque-sable-bord/60 text-petanque-vert-fonce hover:border-petanque-vert/40'
                }`}
              >
                <span className="text-[9px] uppercase tracking-widest text-petanque-bois">
                  {isPreviewMode ? 'Aperçu' : 'Vue'}
                </span>
                <span className="font-medium capitalize">{viewRole}</span>
                <span className="text-petanque-bois text-[9px]">▾</span>
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-petanque-sable-bord rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                  {(['organisateur', 'joueur', 'spectateur'] as ViewRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => { setViewRole(role); setShowRoleMenu(false) }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-petanque-sable-pale capitalize ${
                        viewRole === role ? 'text-petanque-vert-fonce font-medium' : 'text-petanque-bois'
                      }`}
                    >
                      {role === 'organisateur' ? 'Organisateur' : role === 'joueur' ? 'Joueur (aperçu)' : 'Spectateur (aperçu)'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

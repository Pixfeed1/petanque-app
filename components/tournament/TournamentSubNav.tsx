'use client'

import { useState } from 'react'

export type ViewRole = 'organisateur' | 'joueur' | 'spectateur'

export interface SubNavSection {
  id: string
  label: string
  meta?: string
  isActive: boolean
  onClick: () => void
}

interface TournamentSubNavProps {
  sections: SubNavSection[]
  viewRole: ViewRole
  setViewRole: (role: ViewRole) => void
  /** Le vrai role de l'utilisateur. Le toggle 'Vue' n'est affiche que si organisateur. */
  baseRole?: ViewRole
  /** True si l'organisateur est en mode preview (joueur ou spectateur) */
  isPreviewMode?: boolean
}

export default function TournamentSubNav({
  sections,
  viewRole,
  setViewRole,
  baseRole = 'organisateur',  // par defaut : compat ascendante, toggle visible
  isPreviewMode = false
}: TournamentSubNavProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  return (
    <nav className="sticky top-14 z-40 bg-petanque-sable border-b border-petanque-sable-bord/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-10">
          <div className="flex gap-6 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={s.onClick}
                className={`text-xs whitespace-nowrap py-2 transition-colors relative ${
                  s.isActive
                    ? 'text-petanque-vert-fonce font-medium'
                    : 'text-petanque-bois hover:text-petanque-vert-fonce'
                }`}
              >
                {s.label}
                {s.meta && <span className="text-petanque-sable-bord ml-1.5 font-mono">{s.meta}</span>}
                {s.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-petanque-vert"></span>
                )}
              </button>
            ))}
          </div>
          {baseRole === 'organisateur' && (
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
                    {role === 'organisateur' ? 'Organisateur' : role === 'joueur' ? 'Joueur' : 'Spectateur'}
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

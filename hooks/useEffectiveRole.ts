'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Joueur } from '@/lib/types'

export type ViewRole = 'organisateur' | 'joueur' | 'spectateur'

interface Team {
  id: string | number
  joueur_ids?: string[] | null
}

interface UseEffectiveRoleParams {
  tournamentId: string | number | null | undefined
  orgId: string | number | null | undefined
  teams: Team[]
  isOrganizer: boolean
  previewRole?: ViewRole | null  // si organisateur prévisualise une autre vue
  selectedPlayerIds?: string[] | null  // tournament.settings.players, pour filtrer les joueurs du tournoi
}

export interface EffectiveRoleResult {
  /** Le rôle effectif appliqué dans l'UI (= baseRole sauf si organisateur en mode preview) */
  effectiveRole: ViewRole
  /** Le vrai rôle de l'utilisateur (ignore le preview) */
  baseRole: ViewRole
  /** Id du joueur correspondant à l'utilisateur (s'il y en a un) */
  myJoueurId: string | null
  /** Id de l'équipe à laquelle l'utilisateur appartient (s'il joue dans ce tournoi) */
  myEquipeId: string | null
  /** True si l'organisateur est en train de prévisualiser une autre vue */
  isPreviewMode: boolean
  /** Raccourci : true si peut gérer le tournoi (organisateur réel ou en preview organisateur) */
  canManage: boolean
  /** Renvoie true si l'utilisateur peut saisir le score d'un match donné */
  canEditMatchScore: (matchEquipeIds: Array<string | null | undefined>) => boolean
  /** True pendant le chargement initial des joueurs */
  loading: boolean
}

/**
 * Détermine le rôle effectif d'un utilisateur sur un tournoi.
 *
 * Logique :
 * - Organisateur du tournoi → 'organisateur'
 * - Email du user match un joueur du tournoi → 'joueur' (+ identification de son équipe)
 * - Sinon → 'spectateur'
 *
 * L'organisateur peut prévisualiser une autre vue via `previewRole` pour tester l'expérience.
 */
export function useEffectiveRole({
  tournamentId,
  orgId,
  teams,
  isOrganizer,
  previewRole,
  selectedPlayerIds
}: UseEffectiveRoleParams): EffectiveRoleResult {
  const { user } = useAuth()
  const [joueurs, setJoueurs] = useState<Joueur[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch joueurs du tournoi (uniquement si on n'est pas organisateur)
  // Si organisateur, on n'a pas besoin de matcher → loading = false direct
  useEffect(() => {
    if (!tournamentId || !orgId || !user?.email || isOrganizer) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetch(`/api/joueurs?org_id=${orgId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (cancelled) return
        const arr: Joueur[] = Array.isArray(data) ? data : (data.joueurs || [])
        // Filtrer pour ne garder que les joueurs de ce tournoi
        const filtered = selectedPlayerIds
          ? arr.filter(j => selectedPlayerIds.includes(String(j.id)))
          : arr
        setJoueurs(filtered)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tournamentId, orgId, user?.email, isOrganizer, selectedPlayerIds])

  return useMemo<EffectiveRoleResult>(() => {
    let baseRole: ViewRole = 'spectateur'
    let myJoueurId: string | null = null
    let myEquipeId: string | null = null

    if (isOrganizer) {
      baseRole = 'organisateur'
    } else if (user?.email && joueurs.length > 0) {
      const userEmail = user.email.toLowerCase()
      const myJoueur = joueurs.find(j => j.email?.toLowerCase() === userEmail)
      if (myJoueur) {
        baseRole = 'joueur'
        myJoueurId = String(myJoueur.id)
        const myEquipe = teams.find(t => t.joueur_ids?.includes(myJoueurId!))
        if (myEquipe) myEquipeId = String(myEquipe.id)
      }
    }

    // Override par le preview si organisateur
    const effectiveRole: ViewRole = (baseRole === 'organisateur' && previewRole)
      ? previewRole
      : baseRole
    const isPreviewMode = baseRole === 'organisateur'
      && previewRole !== null
      && previewRole !== undefined
      && previewRole !== 'organisateur'

    const canManage = effectiveRole === 'organisateur'

    const canEditMatchScore = (matchEquipeIds: Array<string | null | undefined>): boolean => {
      if (canManage) return true
      if (effectiveRole === 'joueur' && myEquipeId) {
        return matchEquipeIds.some(id => id && String(id) === myEquipeId)
      }
      return false
    }

    return {
      effectiveRole,
      baseRole,
      myJoueurId,
      myEquipeId,
      isPreviewMode,
      canManage,
      canEditMatchScore,
      loading
    }
  }, [isOrganizer, user, joueurs, teams, previewRole, loading])
}

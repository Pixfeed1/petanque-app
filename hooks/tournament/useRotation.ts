/**
 * Hook pour la gestion de la rotation en mêlée tournante
 * - Création de nouvelles équipes avec mélange
 * - Génération des matchs de rotation
 * - Gestion des tours
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { MixiteService } from '@/lib/services/mixite.service'
import { TirageService } from '@/lib/services'
import { teamGenderProfile, pairRoundByMixite } from '@/lib/services/mixiteAdversaire'
import type { Joueur } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

/**
 * Matchs appartenant à une rotation donnée, identifiés par l'APPARTENANCE
 * d'équipe (équipes nommées `R{n}-…`) et NON par `m.tour`.
 * En doublette/triplette, le tour 1 est étalé sur plusieurs tours Berger
 * (1,2,3…) : filtrer par `m.tour === rotation` ne verrait qu'une partie des
 * matchs et permettait de tourner prématurément.
 */
function matchesOfRotation(teams: Team[], matches: Match[], rotation: number): Match[] {
  const ids = new Set(
    teams.filter(t => t.name.startsWith(`R${rotation}-`)).map(t => t.id)
  )
  if (ids.size === 0) return []
  return matches.filter(m =>
    (m.equipe_a_id && ids.has(m.equipe_a_id)) ||
    (m.equipe_b_id && ids.has(m.equipe_b_id))
  )
}

interface UseRotationProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  loadTournamentData: () => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
}

interface UseRotationReturn {
  // States
  currentRotation: number
  setCurrentRotation: React.Dispatch<React.SetStateAction<number>>
  isRotationAvailable: boolean

  // Actions
  reformTeamsForRotation: () => Promise<void>
}

export function useRotation({
  tournament,
  teams,
  matches,
  loadTournamentData,
  onSuccess,
  onError,
  onWarning
}: UseRotationProps): UseRotationReturn {
  const { organization } = useAuth()

  // Système de notification avec fallback
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  const [currentRotation, setCurrentRotation] = useState(1)

  // Recalculer currentRotation depuis les données existantes au chargement
  useEffect(() => {
    if (!tournament || tournament.mode !== 'melee_tournante') return

    // Dérivation FIABLE : le numéro de rotation le plus élevé parmi les noms
    // d'équipes `R{n}-…`. On n'utilise PLUS le `tour` max des matchs : en
    // doublette/triplette, le tour 1 s'étale sur plusieurs tours Berger (1,2,3),
    // ce qui faisait dériver currentRotation à 3 dès le tour 1 (rotation
    // prématurée + numérotation qui saute R1→R4).
    let maxRotation = 1
    for (const team of teams) {
      const m = team.name.match(/^R(\d+)-/)
      if (m) {
        const rotNum = parseInt(m[1], 10)
        if (rotNum > maxRotation) maxRotation = rotNum
      }
    }

    // Fallback : settings.current_round si aucune équipe R{n}- n'est encore chargée
    const fromSettings = tournament.settings.current_round || 1
    const derived = Math.max(maxRotation, fromSettings)

    if (derived !== currentRotation) {
      setCurrentRotation(derived)
    }
  }, [tournament, teams, matches])

  /**
   * Vérifie si la rotation est disponible (tous les matchs terminés selon le mode)
   */
  const isRotationAvailable = useMemo(() => {
    if (tournament?.mode !== 'melee_tournante') return false

    // Mode « N parties » : plus de nouvelle partie une fois les N atteintes.
    const nombreParties = tournament.settings.nombreParties || 0
    if (nombreParties > 0 && currentRotation >= nombreParties) return false

    const rotationType = tournament.settings.meleeRotation || 'par_tour'
    const currentRotationMatches = matchesOfRotation(teams, matches, currentRotation)

    if (currentRotationMatches.length === 0) return false

    if (rotationType === 'par_match') {
      // Mode par_match : besoin d'au moins 1 match terminé
      return currentRotationMatches.some(m => m.status === 'termine')
    } else {
      // Mode par_tour : besoin que TOUS les matchs soient terminés
      return currentRotationMatches.every(m => m.status === 'termine')
    }
  }, [tournament, teams, matches, currentRotation])

  /**
   * Crée de nouvelles équipes avec anti-rematch et mixité
   * Utilise l'historique des rotations précédentes pour minimiser les doublons
   */
  // Fix Bug #4 : calcule les équipes en mémoire (sans POST), retourne le tableau
  // + une table des genres (pour la mixité des adversaires au moment de l'appariement).
  const buildNewTeams = useCallback(async (): Promise<{ teams: Array<{ name: string; joueur_ids: string[] }>; genderById: Map<string, 'H' | 'F'> } | null> => {
    if (!organization || !tournament?.settings.players) return null

    try {
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })
      if (!joueursResponse.ok) return null

      const data = await joueursResponse.json()
      const allPlayers = Array.isArray(data) ? data : data.joueurs || []
      const players = allPlayers.filter((p: Joueur) =>
        tournament.settings.players.includes(p.id)
      )
      if (players.length === 0) return null

      const genderById = new Map<string, 'H' | 'F'>()
      for (const p of players as Joueur[]) genderById.set(p.id, p.gender === 'F' ? 'F' : 'H')

      const isTeteATete = tournament.format === 'tete_a_tete'
      const teamSize = isTeteATete ? 1 : (tournament.format === 'doublette' ? 2 : 3)
      const newRotation = currentRotation + 1
      let teamNumber = 1

      let teamCompositions: Array<{ joueur_ids: string[] }>

      const needsMixite = tournament.settings.mixiteObligatoire || false
      const rotationType = tournament.settings.meleeRotation || 'par_tour'

      if (isTeteATete) {
        // Tête-à-tête : 1 joueur = 1 équipe, identité STABLE entre rotations.
        // Ordre = settings.players, pour que rotation r corresponde à la ronde de Berger r
        // (chaque joueur affronte un nouvel adversaire, sans répétition).
        const order = tournament.settings.players
        const sortedPlayers = [...players].sort(
          (a: Joueur, b: Joueur) => order.indexOf(a.id) - order.indexOf(b.id)
        )
        teamCompositions = sortedPlayers.map((p: Joueur) => ({ joueur_ids: [p.id] }))
      } else {
        // FIX M3 : en par_match, ne PAS re-mélanger les joueurs encore engagés dans
        // un match non terminé du tour courant (sinon ils seraient dans 2 matchs à la
        // fois). On ne recompose qu'avec les joueurs libérés.
        let roster = players
        if (rotationType === 'par_match') {
          const engaged = new Set<string>()
          for (const m of matchesOfRotation(teams, matches, currentRotation)) {
            if (m.status === 'termine') continue
            for (const tid of [m.equipe_a_id, m.equipe_b_id]) {
              const tm = teams.find(t => t.id === tid)
              tm?.joueur_ids?.forEach(id => engaged.add(id))
            }
          }
          roster = players.filter((p: Joueur) => !engaged.has(p.id))
          if (roster.length < teamSize) {
            notify.warning('Pas assez de joueurs libérés pour former une nouvelle rotation. Attendez la fin d\'autres matchs.')
            return null
          }
        }

        // FIX M4 : mixité obligatoire → tous les joueurs doivent avoir un genre.
        if (needsMixite) {
          const genderValidation = MixiteService.validatePlayerGenders(roster, true)
          if (!genderValidation.valid) {
            notify.error(genderValidation.error || 'Certains joueurs n\'ont pas de genre défini')
            return null
          }
        }

        const previousTeams = teams
          .filter(t => t.name.match(/^R\d+-/))
          .map(t => ({ joueur_ids: t.joueur_ids || [] }))
          .filter(t => t.joueur_ids.length > 0)

        const previousMatches: Array<{ equipe_a_joueur_ids: string[]; equipe_b_joueur_ids: string[] }> = []
        for (const match of matches) {
          if (!match.equipe_a_id || !match.equipe_b_id) continue
          const teamA = teams.find(t => t.id === match.equipe_a_id)
          const teamB = teams.find(t => t.id === match.equipe_b_id)
          if (teamA?.joueur_ids?.length && teamB?.joueur_ids?.length) {
            previousMatches.push({
              equipe_a_joueur_ids: teamA.joueur_ids,
              equipe_b_joueur_ids: teamB.joueur_ids
            })
          }
        }

        // Équité de l'exempt : reconstituer, ronde par ronde, les joueurs au repos.
        const rosterIds = roster.map((p: Joueur) => p.id)
        const idsByRound = new Map<number, Set<string>>()
        for (const t of teams) {
          const rm = t.name.match(/^R(\d+)-/)
          if (!rm) continue
          const r = parseInt(rm[1], 10)
          if (!idsByRound.has(r)) idsByRound.set(r, new Set())
          for (const id of (t.joueur_ids || [])) idsByRound.get(r)!.add(id)
        }
        const previousExempt: string[] = []
        for (const idsInRound of idsByRound.values()) {
          for (const id of rosterIds) {
            if (!idsInRound.has(id)) previousExempt.push(id)
          }
        }

        // FIX M2 : anti-rematch AVEC contrainte de mixité (le paramètre `mixite`
        // garde les équipes mixtes tout en minimisant les re-matchs). Avant, la
        // mixité passait par un simple mélange qui ignorait l'historique.
        const { teams: newCompositions, exempt } = TirageService.antiRematchTeamFormation(
          roster.map((p: Joueur) => ({ id: p.id, gender: p.gender as 'H' | 'F' | undefined })),
          previousTeams,
          previousMatches,
          teamSize as 2 | 3,
          previousExempt,
          needsMixite
        )
        teamCompositions = newCompositions

        if (exempt.length > 0) {
          const exemptNames = exempt.map(
            id => roster.find((p: Joueur) => p.id === id)?.name || id
          )
          notify.warning(`${exempt.length} joueur(s) au repos cette ronde : ${exemptNames.join(', ')}`)
        }
      }

      return {
        teams: teamCompositions.map(team => ({
          name: `R${newRotation}-Équipe ${teamNumber++}`,
          joueur_ids: team.joueur_ids
        })),
        genderById
      }
    } catch (error) {
      console.error('Erreur calcul équipes:', error)
      return null
    }
  }, [organization, tournament, teams, matches, currentRotation])

  /**
   * Crée les matchs round-robin pour les équipes du tour de rotation
   */
  // Fix Bug #4 : calcule les matchs en mémoire avec team_a_index (référence par index, pas UUID)
  const buildMatchesForRotation = useCallback((
    rotationNumber: number,
    newTeams: Array<{ name: string; joueur_ids: string[] }>,
    genderById?: Map<string, 'H' | 'F'>
  ): Array<{
    tour: number
    terrain: number | null
    team_a_index: number
    team_b_index: number | null
    type: string
    poule: string | null
    status: string
  }> => {
    if (!tournament || newTeams.length === 0) return []

    // Équipes virtuelles avec id = index (le serveur résoudra en UUID après création)
    const virtualTeams = newTeams.map((t, idx) => ({
      id: String(idx),
      name: t.name
    }))

    // MODE « PARTIES » ou MIXITÉ DES ADVERSAIRES (doublette/triplette) :
    // une rotation = UN match par équipe (pas un round-robin). Avec mixité
    // adversaire, l'appariement respecte les profils de genre ; sinon simple.
    const partiesMode = !!tournament.settings.nombreParties
    const useMixite = !!tournament.settings.mixiteAdversaire && !!genderById
    if (
      tournament.format !== 'tete_a_tete' &&
      (useMixite || partiesMode)
    ) {
      const profiles = useMixite
        ? newTeams.map(t => teamGenderProfile(t.joueur_ids, genderById!))
        : newTeams.map(() => 'N' as const)
      const { pairs } = pairRoundByMixite(profiles)
      const forTerrain = pairs.map(([a, b], idx) => ({ id: `rot_${idx}`, equipe_a_id: String(a), equipe_b_id: String(b), tour: rotationNumber }))
      const terrains = tournament.settings.terrains || 0
      const tMap = terrains > 0 ? TirageService.smartTerrainAssignment(forTerrain, terrains) : null
      return pairs.map(([a, b], idx) => ({
        tour: rotationNumber,
        terrain: tMap?.get(`rot_${idx}`) || null,
        team_a_index: a,
        team_b_index: b,
        type: 'poule',
        poule: null,
        status: 'a_jouer'
      }))
    }

    // Tête-à-tête : une rotation = UNE ronde de Berger (chaque joueur un nouvel adversaire).
    // Doublette/triplette : round-robin complet sur les équipes rebrassées (comportement existant).
    const bergerMatches = tournament.format === 'tete_a_tete'
      ? TirageService.bergerRoundForRotation(virtualTeams, rotationNumber)
      : TirageService.generateBergerMatches(virtualTeams, null)

    const terrains = tournament.settings.terrains || 0
    let terrainMap: Map<string, number> | null = null
    if (terrains > 0) {
      const matchesForTerrain = bergerMatches.map((m, idx) => ({
        id: `rot_${idx}`,
        equipe_a_id: m.teamA.id,
        equipe_b_id: m.teamB.id,
        tour: m.tour
      }))
      terrainMap = TirageService.smartTerrainAssignment(matchesForTerrain, terrains)
    }

    return bergerMatches.map((m, idx) => ({
      tour: rotationNumber,
      terrain: terrainMap?.get(`rot_${idx}`) || null,
      team_a_index: parseInt(m.teamA.id, 10),
      team_b_index: parseInt(m.teamB.id, 10),
      type: 'poule',
      poule: null,
      status: 'a_jouer'
    }))
  }, [tournament])

  /**
   * Reformule les équipes pour une nouvelle rotation
   */
  const reformTeamsForRotation = useCallback(async () => {
    if (tournament?.mode !== 'melee_tournante') return
    if (!tournament?.settings.players) return

    const rotationType = tournament.settings.meleeRotation || 'par_tour'

    // Vérifier si les équipes pour le prochain tour existent déjà
    const nextRotation = currentRotation + 1
    const nextRotationTeams = teams.filter(t => t.name.startsWith(`R${nextRotation}-`))
    if (nextRotationTeams.length > 0) {
      notify.warning(`Les équipes pour la rotation ${nextRotation} existent déjà. Impossible de créer une nouvelle rotation.`)
      return
    }

    // Matchs de la rotation courante, identifiés par appartenance d'équipe (R{n}-)
    const currentRotationMatches = matchesOfRotation(teams, matches, currentRotation)

    if (currentRotationMatches.length === 0) {
      notify.warning('Aucun match trouvé pour le tour actuel. Créez d\'abord des matchs avant de faire une rotation.')
      return
    }

    if (rotationType === 'par_match') {
      const hasFinishedMatch = currentRotationMatches.some(m => m.status === 'termine')
      if (!hasFinishedMatch) {
        notify.warning('Mode rotation par match: Au moins 1 match doit être terminé avant de pouvoir créer une nouvelle rotation.')
        return
      }
    } else {
      const allFinished = currentRotationMatches.every(m => m.status === 'termine')
      if (!allFinished) {
        const remainingMatches = currentRotationMatches.filter(m => m.status !== 'termine').length
        notify.warning(`Mode rotation par tour: Tous les matchs du tour ${currentRotation} doivent être terminés. Matchs restants: ${remainingMatches}`)
        return
      }
    }

    // Validation mixité si obligatoire
    if (tournament.settings.mixiteObligatoire) {
      try {
        const joueursResponse = await fetch(`/api/joueurs?org_id=${organization?.id}`, {
          credentials: 'include'
        })
        if (!joueursResponse.ok) return

        const joueursData = await joueursResponse.json()
        const allPlayers = Array.isArray(joueursData) ? joueursData : joueursData.joueurs || []
        const players = allPlayers.filter((p: Joueur) =>
          tournament.settings.players.includes(p.id)
        )

        const hommes = players.filter((p: Joueur) => p.gender === 'H')
        const femmes = players.filter((p: Joueur) => p.gender === 'F')

        // Vérifier si la mixité est faisable
        if (tournament.format === 'doublette') {
          if (hommes.length < 1 || femmes.length < 1) {
            notify.error('Mixité impossible: La doublette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        } else {
          if (hommes.length < 1 || femmes.length < 1) {
            notify.error('Mixité impossible: La triplette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        }
      } catch (error) {
        console.error('Erreur validation mixité:', error)
        notify.error('Erreur lors de la validation de la mixité')
        return
      }
    }

    try {
      const newRotation = currentRotation + 1

      const existingMatches = matches.filter(m => m.tour === newRotation)
      if (existingMatches.length > 0) {
        notify.warning(`Les matchs pour la rotation ${newRotation} existent déjà.`)
        return
      }

      // Fix Bug #4 : calcul des équipes ET matchs EN MÉMOIRE
      const built = await buildNewTeams()
      if (!built || built.teams.length === 0) {
        notify.error('Échec du calcul des équipes pour la rotation')
        return
      }
      const newTeams = built.teams

      const newMatches = buildMatchesForRotation(newRotation, newTeams, built.genderById)
      if (newMatches.length === 0) {
        notify.error('Échec du calcul des matchs pour la rotation')
        return
      }

      // 1 SEUL POST transactionnel : équipes + matchs créés ensemble (rollback auto si erreur)
      const response = await fetch(`/api/tournois/${tournament.id}/new-rotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rotation_number: newRotation,
          teams: newTeams,
          matches: newMatches
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      setCurrentRotation(newRotation)
      await loadTournamentData()
      notify.success(`Rotation ${newRotation} créée avec succès ! ${newTeams.length} équipes et ${newMatches.length} matchs prêts.`)
    } catch (error) {
      console.error('Erreur rotation:', error)
      notify.error(`Erreur lors de la création de la rotation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }, [tournament, teams, matches, currentRotation, organization, buildNewTeams, buildMatchesForRotation, loadTournamentData])

  return {
    // States
    currentRotation,
    setCurrentRotation,
    isRotationAvailable,

    // Actions
    reformTeamsForRotation
  }
}

export default useRotation

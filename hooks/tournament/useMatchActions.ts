/**
 * Hook pour la gestion des matchs d'un tournoi
 * - Génération des poules et matchs
 * - Phases éliminatoires
 * - Finales
 * - Assignation de terrains
 */

import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { ValidationService, BracketService, StatsService, TirageService } from '@/lib/services'
import { teamGenderProfile, pairRound, type GenderProfile } from '@/lib/services/mixiteAdversaire'
import type { Match as MatchType } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

interface UseMatchActionsProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  loadTournamentData: () => Promise<void>
  getTeamPlayers: (teamId: string | null | undefined) => string[]
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
  onConfirmTerrainConflict?: (message: string) => Promise<boolean>
}

interface UseMatchActionsReturn {
  // Validation helpers
  isValidPoolConfiguration: (teamCount: number, poolSize: number) => boolean
  getValidPoolSizes: (teamCount: number) => number[]
  getPoolDistribution: (teamCount: number, poolSize: number) => number[]

  // Actions
  generatePoules: () => Promise<boolean>
  generatePartie: (partieNum: number) => Promise<boolean>
  generateEliminationPhases: () => Promise<void>
  generateFinales: () => Promise<void>
  generateNextEliminationRound: () => Promise<void>
  assignTerrain: (matchId: string, terrain: number) => Promise<void>
  createRoundRobinMatches: (teams: Team[], tour: number, poule: string | null) => Promise<void>
}

export function useMatchActions({
  tournament,
  teams,
  matches,
  loadTournamentData,
  getTeamPlayers,
  onSuccess,
  onError,
  onWarning,
  onConfirmTerrainConflict
}: UseMatchActionsProps): UseMatchActionsReturn {
  const { organization } = useAuth()

  // Helpers pour notifications (fallback sur console si pas de callback)
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  /**
   * Valide si une configuration de poules est viable
   */
  const isValidPoolConfiguration = useCallback((teamCount: number, poolSize: number): boolean => {
    if (teamCount < 4 || poolSize < 3) return false

    // Fix Bug #2 : utiliser la distribution équilibrée du serveur
    // Ex: 14 équipes en poules de 4 = [4,4,3,3] (valide) au lieu de [4,4,4,2] (rejeté)
    const sizes = TirageService.calculateBalancedPoolSizes(teamCount, poolSize)
    return sizes.length > 0 && sizes.every(size => size >= 3)
  }, [])

  /**
   * Retourne les tailles de poules valides pour un nombre d'équipes
   */
  const getValidPoolSizes = useCallback((teamCount: number): number[] => {
    const validSizes: number[] = []

    for (let size = 3; size <= 6; size++) {
      if (isValidPoolConfiguration(teamCount, size)) {
        validSizes.push(size)
      }
    }

    return validSizes
  }, [isValidPoolConfiguration])

  /**
   * Calcule la distribution équilibrée des équipes dans les poules
   * Ex: 14 équipes, poules de 4 → [4, 4, 3, 3] au lieu de [4, 4, 4, 2]
   */
  const getPoolDistribution = useCallback((teamCount: number, poolSize: number): number[] => {
    return TirageService.calculateBalancedPoolSizes(teamCount, poolSize)
  }, [])

  /**
   * Crée des matchs round-robin (tous contre tous) avec scheduling Berger
   * Garantit un planning équilibré : chaque équipe a du repos entre ses matchs
   */
  const createRoundRobinMatches = useCallback(async (
    teamsToMatch: Team[],
    tour: number,
    poule: string | null
  ): Promise<void> => {
    if (!tournament) return

    // Générer le planning avec tables de Berger (scheduling optimal)
    const bergerMatches = TirageService.generateBergerMatches(teamsToMatch, poule)

    // Assignation intelligente des terrains si disponibles
    const terrains = tournament.settings.terrains || 0
    let terrainAssignment: Map<string, number> | null = null

    if (terrains > 0) {
      // Préparer les données pour l'assignation
      const matchesForTerrain = bergerMatches.map((m, idx) => ({
        id: `temp_${idx}`,
        equipe_a_id: m.teamA.id,
        equipe_b_id: m.teamB.id,
        tour: m.tour
      }))

      // Trouver les terrains actuellement occupés
      const occupiedTerrains = matches
        .filter(m => m.status === 'en_cours' && m.terrain)
        .map(m => m.terrain!)

      terrainAssignment = TirageService.smartTerrainAssignment(
        matchesForTerrain,
        terrains,
        occupiedTerrains
      )
    }

    // Créer les matchs en batch
    const matchesToCreate = bergerMatches.map((m, idx) => ({
      tournoi_id: tournament.id,
      equipe_a_id: m.teamA.id,
      equipe_b_id: m.teamB.id,
      tour: tour + m.tour - 1,
      terrain: terrainAssignment?.get(`temp_${idx}`) || null,
      type: 'poule' as const,
      poule: m.poule,
      status: 'a_jouer' as const
    }))

    try {
      const response = await fetch('/api/matches/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: matchesToCreate })
      })

      if (!response.ok) {
        // Fallback : créer les matchs un par un si le batch échoue
        console.warn(`Batch API échouée (${response.status}), fallback sur création individuelle`)
        for (const match of matchesToCreate) {
          const singleResponse = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(match)
          })
          if (!singleResponse.ok) {
            const error = await singleResponse.json().catch(() => ({ error: 'Erreur inconnue' }))
            throw new Error(error.error || `Échec création match (${singleResponse.status})`)
          }
        }
      }
    } catch (error) {
      console.error(`Erreur création matchs poule ${poule}:`, error)
      throw error
    }
  }, [tournament, matches])

  /**
   * Génère les poules du tournoi avec tirage intelligent
   * - Distribution serpentin (snake draft) pour des poules équilibrées
   * - Tailles de poules équilibrées (ex: 4-4-3-3 au lieu de 4-4-4-2)
   * - Scheduling Berger pour les matchs (repos entre matchs d'une même équipe)
   */
  const generatePoules = useCallback(async (): Promise<boolean> => {
    if (!tournament || teams.length === 0) return false

    const pouleSize = tournament.settings.pouleSize || 4

    if (!isValidPoolConfiguration(teams.length, pouleSize)) {
      notify.error(`Configuration invalide: ${teams.length} équipes en poules de ${pouleSize} créerait des poules déséquilibrées`)
      return false
    }

    const existingPouleMatches = matches.filter(m => m.type === 'poule')
    const hasExistingMatches = existingPouleMatches.length > 0

    if (hasExistingMatches) {
      const hasPlayedMatches = existingPouleMatches.some(m => m.status === 'en_cours' || m.status === 'termine')
      if (hasPlayedMatches) {
        notify.warning('Impossible de régénérer les poules : des matchs ont déjà été joués.')
        return false
      }
      const message = 'Des poules existent déjà. Voulez-vous les supprimer et en régénérer de nouvelles ?'
      const confirmed = onConfirmTerrainConflict
        ? await onConfirmTerrainConflict(message)
        : window.confirm(message)
      if (!confirmed) return false
    }

    // Distribution serpentin (snake draft) pour des poules équilibrées
    const poules = TirageService.snakeDraftDistribution(teams, pouleSize)

    // Fix Bug #4 : construire TOUS les matchs en mémoire puis 1 seul appel transactionnel
    const allMatches: Array<{
      equipe_a_id: string
      equipe_b_id: string
      tour: number
      terrain: number | null
      type: 'poule'
      poule: string
      status: 'a_jouer'
    }> = []

    const terrains = tournament.settings.terrains || 0
    const occupiedTerrains = matches
      .filter(m => m.status === 'en_cours' && m.terrain)
      .map(m => m.terrain!)

    for (const [pouleName, pouleTeams] of Object.entries(poules)) {
      const bergerMatches = TirageService.generateBergerMatches(pouleTeams, pouleName)

      let terrainAssignment: Map<string, number> | null = null
      if (terrains > 0) {
        const matchesForTerrain = bergerMatches.map((m, idx) => ({
          id: `temp_${pouleName}_${idx}`,
          equipe_a_id: m.teamA.id,
          equipe_b_id: m.teamB.id,
          tour: m.tour
        }))
        terrainAssignment = TirageService.smartTerrainAssignment(
          matchesForTerrain,
          terrains,
          occupiedTerrains
        )
      }

      bergerMatches.forEach((m, idx) => {
        allMatches.push({
          equipe_a_id: m.teamA.id,
          equipe_b_id: m.teamB.id,
          tour: m.tour,
          terrain: terrainAssignment?.get(`temp_${pouleName}_${idx}`) || null,
          type: 'poule',
          poule: pouleName,
          status: 'a_jouer'
        })
      })
    }

    try {
      if (hasExistingMatches) {
        // Endpoint transactionnel : supprime anciens + crée nouveaux en 1 transaction PG
        const response = await fetch(`/api/tournois/${tournament.id}/regenerate-poules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ matches: allMatches })
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(err.error || `HTTP ${response.status}`)
        }
      } else {
        const matchesToCreate = allMatches.map(m => ({ ...m, tournoi_id: tournament.id }))
        const response = await fetch('/api/matches/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ matches: matchesToCreate })
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(err.error || `HTTP ${response.status}`)
        }
      }

      const nbPoules = Object.keys(poules).length
      const sizes = Object.values(poules).map(p => p.length).join('-')
      notify.success(`${nbPoules} poules générées (${sizes}) avec tirage serpentin`)
      await loadTournamentData()
      return true
    } catch (error) {
      console.error('Erreur génération poules:', error)
      notify.error(`Erreur génération poules: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      return false
    }
  }, [tournament, teams, matches, isValidPoolConfiguration, loadTournamentData, onConfirmTerrainConflict])

  /**
   * MODE « N PARTIES » à équipes FIXES (choisi / mêlée simple).
   * Génère la partie `partieNum` : on garde les équipes, on RE-TIRE seulement les
   * adversaires — en évitant les adversaires déjà rencontrés (et en respectant la
   * mixité des adversaires si activée). Chaque partie = un match par équipe (tour = partieNum).
   */
  const generatePartie = useCallback(async (partieNum: number): Promise<boolean> => {
    if (!tournament || teams.length < 2) {
      notify.error('Il faut au moins 2 équipes pour lancer une partie.')
      return false
    }

    const pairKey = (a: string, b: string) => [a, b].sort().join('|')
    // Adversaires déjà rencontrés (toutes parties confondues)
    const played = new Set<string>()
    matches.forEach(m => {
      if (m.equipe_a_id && m.equipe_b_id) played.add(pairKey(m.equipe_a_id, m.equipe_b_id))
    })

    // Profils de genre si mixité des adversaires (nécessite les genres → fetch joueurs)
    let profiles: GenderProfile[] = teams.map(() => 'N')
    if (tournament.settings.mixiteAdversaire && organization?.id) {
      try {
        const r = await fetch(`/api/joueurs?org_id=${organization.id}`, { credentials: 'include' })
        if (r.ok) {
          const data = await r.json()
          const all = Array.isArray(data) ? data : data.joueurs || []
          const genderById = new Map<string, 'H' | 'F'>()
          for (const p of all) genderById.set(p.id, p.gender === 'F' ? 'F' : 'H')
          profiles = teams.map(t => teamGenderProfile(t.joueur_ids || [], genderById))
        }
      } catch { /* pas de genre → appariement sans contrainte de mixité */ }
    }

    const { pairs, repeats } = pairRound(profiles, (i, j) => played.has(pairKey(teams[i].id, teams[j].id)))
    if (pairs.length === 0) {
      notify.error('Impossible de former des matchs pour cette partie.')
      return false
    }

    const terrains = tournament.settings.terrains || 0
    const forTerrain = pairs.map(([a, b], idx) => ({ id: `p_${idx}`, equipe_a_id: teams[a].id, equipe_b_id: teams[b].id, tour: partieNum }))
    const tMap = terrains > 0 ? TirageService.smartTerrainAssignment(forTerrain, terrains) : null

    const newMatches = pairs.map(([a, b], idx) => ({
      tournoi_id: tournament.id,
      equipe_a_id: teams[a].id,
      equipe_b_id: teams[b].id,
      tour: partieNum,
      terrain: tMap?.get(`p_${idx}`) || null,
      type: 'poule' as const,
      poule: null,
      status: 'a_jouer' as const,
    }))

    try {
      const res = await fetch('/api/matches/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: newMatches }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Erreur serveur')
      }
      await loadTournamentData()
      notify.success(
        `Partie ${partieNum} lancée : ${pairs.length} match${pairs.length > 1 ? 's' : ''}` +
        (repeats ? ` · ${repeats} revanche${repeats > 1 ? 's' : ''} inévitable${repeats > 1 ? 's' : ''}` : '')
      )
      return true
    } catch (e) {
      console.error('Erreur génération partie:', e)
      notify.error(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`)
      return false
    }
  }, [tournament, teams, matches, organization, loadTournamentData])

  /**
   * Génère les phases éliminatoires après les poules
   */
  const generateEliminationPhases = useCallback(async () => {
    if (!tournament) return

    // Vérifier que tous les matchs de poule sont terminés
    const pouleMatches = matches.filter(m => m.type === 'poule')
    const allPouleMatchesFinished = pouleMatches.every(m => m.status === 'termine')

    if (!allPouleMatchesFinished) {
      notify.warning('Tous les matchs de poule doivent être terminés avant de générer les phases finales')
      return
    }

    // Calculer le classement de chaque poule
    const qualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2
    const pouleNames = [...new Set(pouleMatches.map(m => m.poule))]

    // Vérifier avec ValidationService qu'aucune poule n'a un nom null/undefined
    const pouleValidation = ValidationService.validatePouleNames(pouleNames as string[])
    if (!pouleValidation.valid) {
      console.error('❌ ERREUR : Poules sans nom détectées !', pouleNames.filter(p => !p))
      notify.error(pouleValidation.error || 'Erreur de validation des poules')
      return
    }

    const qualified: Array<{ team: Team; poule: string }> = []

    for (const pouleName of pouleNames) {
      if (!pouleName) continue

      // Équipes de cette poule
      const pouleTeamIds = new Set<string>()
      pouleMatches
        .filter(m => m.poule === pouleName)
        .forEach(m => {
          if (m.equipe_a_id) pouleTeamIds.add(m.equipe_a_id)
          if (m.equipe_b_id) pouleTeamIds.add(m.equipe_b_id)
        })

      const pouleTeams = teams.filter(t => pouleTeamIds.has(t.id))

      // Calculer stats pour chaque équipe avec StatsService
      const teamStatsForPoule = pouleTeams.map(team => {
        const teamPouleMatches = pouleMatches.filter(m =>
          m.poule === pouleName &&
          (m.equipe_a_id === team.id || m.equipe_b_id === team.id) &&
          m.status === 'termine'
        )

        const matchesForService = teamPouleMatches.map(m => ({
          id: m.id,
          tournoi_id: tournament?.id || '',
          equipe_a_id: m.equipe_a_id || null,
          equipe_b_id: m.equipe_b_id || null,
          equipe_a: m.equipe_a as any,
          equipe_b: m.equipe_b as any,
          score_a: m.score_a ?? null,
          score_b: m.score_b ?? null,
          tour: m.tour || 0,
          terrain: m.terrain ?? null,
          status: m.status as any,
          type: m.type as any,
          poule: m.poule || null,
          round: null,
          manches_json: m.manches_json || null,
          started_at: m.started_at || null,
          ended_at: m.ended_at || null,
          validated_at: m.validated_at || null,
          played_at: m.played_at || null,
          proposed_by: null,
          proposed_at: null,
          winner_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const stats = StatsService.calculateTeamStats(team.id, team.name, matchesForService as MatchType[], !!tournament?.settings?.fairPlay)

        return {
          team,
          victories: stats.victories,
          difference: stats.difference,
          pointsFor: stats.pointsFor,
          stats
        }
      })

      // FIX BUG : passer matches + poule pour activer le départage par
      // confrontation directe (3e critère FIPJP). Sans ces arguments, deux
      // équipes à égalité de points/différence étaient classées à
      // l'alphabétique, pouvant qualifier la mauvaise équipe.
      const pouleMatchesForRanking = pouleMatches
        .filter(m => m.poule === pouleName && m.status === 'termine')
        .map(m => ({
          equipe_a_id: m.equipe_a_id || null,
          equipe_b_id: m.equipe_b_id || null,
          poule: m.poule || null,
          status: m.status,
          score_a: m.score_a ?? null,
          score_b: m.score_b ?? null
        })) as MatchType[]

      // Trier avec StatsService.sortTeamsByFIPJPRules (confrontation directe incluse)
      const rankings = StatsService.sortTeamsByFIPJPRules(
        teamStatsForPoule.map(t => ({
          id: t.team.id,
          name: t.team.name,
          played: t.stats.played,
          victories: t.stats.victories,
          defeats: t.stats.defeats,
          draws: t.stats.draws,
          pointsFor: t.stats.pointsFor,
          pointsAgainst: t.stats.pointsAgainst,
          difference: t.stats.difference,
          points: t.stats.points
        })),
        pouleMatchesForRanking,
        pouleName
      ).map(stats => teamStatsForPoule.find(t => t.team.id === stats.id))
        .filter((teamStat): teamStat is typeof teamStatsForPoule[number] => teamStat !== undefined)

      // Prendre les N premiers qualifiés
      qualified.push(...rankings.slice(0, qualifiedPerPoule).map(r => ({
        team: r.team,
        poule: pouleName
      })))
    }

    if (qualified.length === 0) {
      notify.warning('Aucune équipe qualifiée trouvée')
      return
    }

    // Seeding avec BracketService
    const nbQualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2

    const reorderedTeamsData = BracketService.applySeedingByRank(
      qualified.map(q => ({
        id: q.team.id,
        name: q.team.name,
        poule: q.poule
      })),
      nbQualifiedPerPoule,
      pouleNames.length
    )

    const reorderedQualified: Team[] = reorderedTeamsData
      .map(data => qualified.find(q => q.team.id === data.id)?.team)
      .filter((team): team is Team => team !== undefined)

    // Double élimination (plan Club) : à partir de 3 équipes, on génère tout le
    // squelette (WB + LB + grande finale) côté serveur via le réducteur. En deçà
    // de 3 équipes, la double élim n'a pas de sens → on retombe sur l'élim simple.
    const eliminationFormat = tournament.settings.eliminationFormat || 'simple'
    if (eliminationFormat === 'double' && reorderedQualified.length >= 3) {
      try {
        const resp = await fetch(`/api/tournois/${tournament.id}/double-elimination`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ teamIdsBySeed: reorderedQualified.map(t => t.id) })
        })
        if (!resp.ok) {
          const error = await resp.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(error.error || `HTTP ${resp.status}`)
        }
        notify.success(`Phase à double élimination générée pour ${reorderedQualified.length} équipes`)
        await loadTournamentData()
      } catch (error) {
        console.error('Erreur génération double élimination:', error)
        notify.error(`Erreur lors de la génération de la double élimination : ${error instanceof Error ? error.message : 'inconnue'}`)
      }
      return
    }

    // FIX : message clair EN AMONT au-delà de 16 qualifiés (l'élimination directe
    // est plafonnée à 16). Sinon l'erreur levée par calculateBracketMatches était
    // masquée par le catch générique et l'organisateur restait bloqué sans savoir quoi faire.
    if (reorderedQualified.length > 16) {
      notify.error(
        `Trop d'équipes qualifiées (${reorderedQualified.length}) pour une élimination directe (max 16). ` +
        `Réduisez le nombre de qualifiés par poule, agrandissez les poules, ou passez en double élimination.`
      )
      return
    }

    try {
      // Fix Bug #1 : utiliser BracketService.generateFirstRoundPairs pour le seeding standard
      // Gère correctement les BYE pour 3, 5, 6, 7, 9-15 qualifiés (le pairing manuel était cassé)
      const bracketPairs = BracketService.generateFirstRoundPairs(
        reorderedQualified.map(t => ({ id: t.id, name: t.name }))
      )

      const matchType = bracketPairs[0]?.round || 'finale'
      const nbMatches = bracketPairs.length
      const nbByes = bracketPairs.filter(p => p.isBye).length

      // Construire tous les matchs (BYE inclus aux bonnes positions) et les créer
      // en UN SEUL appel transactionnel : évite les brackets partiels/dupliqués.
      const elimMatches = bracketPairs
        .filter(pair => pair.teamA)
        .map(pair => pair.isBye
          ? { equipe_a_id: pair.teamA!.id, equipe_b_id: null, tour: 1, type: 'bye', status: 'termine', score_a: 0, score_b: 0 }
          : { equipe_a_id: pair.teamA!.id, equipe_b_id: pair.teamB!.id, tour: 1, type: matchType, status: 'a_jouer' })
        .filter(m => m.type === 'bye' || m.equipe_b_id)

      const elimResp = await fetch(`/api/tournois/${tournament.id}/elimination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: elimMatches })
      })
      if (!elimResp.ok) {
        const error = await elimResp.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(error.error || 'Échec de la génération des phases éliminatoires')
      }

      const byeMsg = nbByes > 0 ? ` (${nbByes} exempt${nbByes > 1 ? 's' : ''})` : ''
      notify.success(`Phases éliminatoires générées : ${nbMatches} match(s) de ${matchType}${byeMsg}`)
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération phases finales:', error)
      notify.error('Erreur lors de la génération des phases finales')
    }
  }, [tournament, teams, matches, loadTournamentData, notify])

  /**
   * Génère la finale et petite finale après les demi-finales
   */
  const generateFinales = useCallback(async () => {
    if (!tournament) return

    const demiMatches = matches.filter(m => m.type === 'demi' && m.status === 'termine')

    // FIX BUG : cas 3 qualifiés → la demi est le PREMIER tour, avec 1 exempt (bye)
    // qui accède directement à la finale. Sans earlier round (quart/huitième), le
    // vainqueur du bye doit compter comme finaliste, sinon la finale n'est jamais
    // générée et le tournoi reste bloqué.
    const hasEarlierRounds = matches.some(m => m.type === 'quart' || m.type === 'huitieme')
    const byeMatchesThisRound = hasEarlierRounds
      ? []
      : matches.filter(m => m.type === 'bye' && m.status === 'termine' && m.equipe_a_id)

    const totalSemifinalSlots = demiMatches.length + byeMatchesThisRound.length
    if (demiMatches.length === 0 || totalSemifinalSlots < 2) {
      notify.warning('Les demi-finales doivent être terminées')
      return
    }

    // Vérifier si finales déjà créées
    const finaleExists = matches.some(m => m.type === 'finale')
    const petiteFinaleExists = matches.some(m => m.type === 'petite_finale')

    if (finaleExists && petiteFinaleExists) {
      notify.warning('Les finales sont déjà créées')
      return
    }

    try {
      const winners: string[] = []
      const losers: string[] = []

      // Utiliser for...of pour permettre un early return propre
      for (const match of demiMatches) {
        if (match.score_a === match.score_b) {
          notify.error(`Égalité détectée dans ${match.equipe_a?.name} vs ${match.equipe_b?.name}. Impossible de créer la finale`)
          return // Early exit propre
        }

        if (!match.equipe_a_id || !match.equipe_b_id) {
          console.warn('⚠️ Match de demi avec équipe manquante, ignoré:', match)
          continue
        }

        if ((match.score_a ?? 0) > (match.score_b ?? 0)) {
          winners.push(match.equipe_a_id)
          losers.push(match.equipe_b_id)
        } else {
          winners.push(match.equipe_b_id)
          losers.push(match.equipe_a_id)
        }
      }

      // Cas 3 qualifiés : ajouter le vainqueur de l'exempt (bye) aux finalistes.
      // Un bye n'a pas de perdant → pas de petite finale possible dans ce cas.
      for (const byeMatch of byeMatchesThisRound) {
        if (byeMatch.equipe_a_id) winners.push(byeMatch.equipe_a_id)
      }

      // Construire finale (+ petite finale si consolante) et créer en UN appel
      // transactionnel avec garde serveur anti-doublon.
      const finaleMatches: Array<Record<string, unknown>> = []
      if (!finaleExists && winners.length === 2) {
        finaleMatches.push({ equipe_a_id: winners[0], equipe_b_id: winners[1], tour: 1, type: 'finale', status: 'a_jouer' })
      }
      if (!petiteFinaleExists && losers.length === 2 && tournament.settings.consolante) {
        finaleMatches.push({ equipe_a_id: losers[0], equipe_b_id: losers[1], tour: 1, type: 'petite_finale', status: 'a_jouer' })
      }

      if (finaleMatches.length > 0) {
        const finaleResp = await fetch(`/api/tournois/${tournament.id}/elimination`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ matches: finaleMatches })
        })
        if (!finaleResp.ok) {
          const error = await finaleResp.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(error.error || 'Échec de la génération des finales')
        }
      }

      notify.success('Finale et petite finale générées avec succès !')
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération finales:', error)
      notify.error('Erreur lors de la génération des finales')
    }
  }, [tournament, matches, loadTournamentData, notify])

  /**
   * Génère le tour d'élimination suivant (huitiemes→quarts, quarts→demis, demis→finale+petite_finale)
   */
  const generateNextEliminationRound = useCallback(async () => {
    if (!tournament) return

    const result = BracketService.nextRoundMatchups(matches as any)

    if (result.kind === 'error') {
      switch (result.code) {
        case 'no_current_round':    notify.warning("Aucun tour d'élimination en cours"); break
        case 'round_unfinished':    notify.warning(`Tous les matchs de ${result.current} doivent être terminés`); break
        case 'no_next_round':       notify.warning('Pas de tour suivant après la finale'); break
        case 'next_already_exists': notify.warning('Les matchs du tour suivant sont déjà créés'); break
        case 'not_enough_winners':  notify.error('Pas assez de gagnants pour créer le tour suivant'); break
      }
      return
    }

    // demi → finale : on délègue (gère finale + petite finale + garde anti-égalité)
    if (result.kind === 'finale') {
      await generateFinales()
      return
    }

    try {
      // Créer tout le tour en UN appel transactionnel (garde serveur anti-doublon)
      const roundMatches = result.pairs.map(pair => ({
        equipe_a_id: pair.a.id,
        equipe_b_id: pair.b.id,
        tour: 1,
        type: result.round,
        status: 'a_jouer'
      }))
      const response = await fetch(`/api/tournois/${tournament.id}/elimination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: roundMatches })
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(error.error || `Échec de la génération du tour ${result.round}`)
      }
      notify.success(`${result.pairs.length} match(s) de ${result.round} générés`)
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération tour suivant:', error)
      notify.error('Erreur lors de la génération du tour suivant')
    }
  }, [tournament, matches, generateFinales, loadTournamentData, notify])

  /**
   * Assigne un terrain à un match
   */
  const assignTerrain = useCallback(async (matchId: string, terrain: number) => {
    try {
      // Vérifier que le numéro de terrain est valide
      if (!tournament?.settings.terrains) {
        notify.error('Nombre de terrains non défini pour ce tournoi')
        return
      }

      const validation = ValidationService.validateTerrainNumber(terrain, tournament.settings.terrains)
      if (!validation.valid) {
        notify.error(validation.error || 'Numéro de terrain invalide')
        return
      }

      // Vérifier les conflits de terrain
      const matchToAssign = matches.find(m => m.id === matchId)
      if (!matchToAssign) return

      // Chercher des matchs en cours ou à jouer sur ce terrain
      const conflicts = matches.filter(m =>
        m.id !== matchId &&
        m.terrain === terrain &&
        (m.status === 'en_cours' || m.status === 'a_jouer')
      )

      if (conflicts.length > 0) {
        const conflictNames = conflicts.map(m => {
          const playersA = getTeamPlayers(m.equipe_a_id || m.equipe_a?.id)
          const playersB = getTeamPlayers(m.equipe_b_id || m.equipe_b?.id)
          const teamADisplay = playersA.length > 0 ? `${m.equipe_a?.name} (${playersA.join(', ')})` : m.equipe_a?.name
          const teamBDisplay = playersB.length > 0 ? `${m.equipe_b?.name} (${playersB.join(', ')})` : m.equipe_b?.name
          return `${teamADisplay} vs ${teamBDisplay}`
        }).join(', ')

        // Utiliser callback si disponible, sinon window.confirm en fallback
        const message = `Le terrain ${terrain} est déjà assigné à : ${conflictNames}. Assigner quand même ?`
        const confirmed = onConfirmTerrainConflict
          ? await onConfirmTerrainConflict(message)
          : window.confirm(message)

        if (!confirmed) return
      }

      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ terrain })
      })

      if (response.ok) {
        await loadTournamentData()
      }
    } catch (error) {
      console.error('Erreur assignation terrain:', error)
    }
  }, [tournament, matches, getTeamPlayers, loadTournamentData])

  return {
    // Validation helpers
    isValidPoolConfiguration,
    getValidPoolSizes,
    getPoolDistribution,

    // Actions
    generatePoules,
    generatePartie,
    generateEliminationPhases,
    generateFinales,
    generateNextEliminationRound,
    assignTerrain,
    createRoundRobinMatches
  }
}

export default useMatchActions
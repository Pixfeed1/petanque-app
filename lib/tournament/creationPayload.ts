/**
 * Construction (pure) du payload de création atomique d'un tournoi.
 * Sépare la logique de composition (équipes + matchs indexés) du hook React
 * pour qu'elle soit testable sans dépendances UI.
 *
 * Les joueurs à créer sont référencés par des jetons "new:<index>" ; le serveur
 * (/api/tournois/full) les résout après insertion.
 */

import { TirageService } from '@/lib/services'
import { MixiteService } from '@/lib/services/mixite.service'
import { teamGenderProfile, pairRoundByMixite } from '@/lib/services/mixiteAdversaire'
import { balancedTeamsByLevel, seedTeamsByLevel } from '@/lib/services/levelBalancing'
import { NIVEAU_BASE } from '@/lib/services/playerHistory'
import type { Joueur } from '@/lib/types'

export interface FullTeamInput { name: string; joueur_ids: string[] }
export interface FullMatchInput {
  team_a_index: number
  team_b_index: number | null
  tour: number
  terrain: number | null
  type: string
  poule: string | null
  status: string
}
export interface PlayerRef { id: string; name: string; gender?: 'H' | 'F'; email?: string; niveau?: number }

export interface CreationComposition {
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  mixiteObligatoire: boolean
  /** Mixité des adversaires (mêlée tournante) : une partie = un adversaire de profil compatible. */
  mixiteAdversaire?: boolean
  /** Nombre de parties fixé (2/3/4). Structure le tournoi en rondes : une partie = un match par équipe. */
  nombreParties?: number
  /** Équilibrage par niveau cumulé : compose des équipes homogènes et ensemence les poules
   * à partir de l'historique inter-concours des joueurs (au lieu d'un tirage aléatoire). */
  equilibrageNiveau?: boolean
  pouleSize: number
  terrains: number
}

/**
 * Construit les équipes + matchs (indexés par position d'équipe) à partir des
 * joueurs (ids réels ou jetons "new:N"). Réutilise les mêmes algorithmes que le
 * flux historique (mixité, serpentin, Berger, terrains).
 */
export function buildTeamsAndMatches(
  cfg: CreationComposition,
  combinedPlayers: PlayerRef[]
): { teams: FullTeamInput[]; matches: FullMatchInput[]; unassignedCount: number } {
  const allPlayerIds = combinedPlayers.map(p => p.id)
  const playersPerTeam = cfg.format === 'tete_a_tete' ? 1 : cfg.format === 'doublette' ? 2 : 3

  // MODE CHOISI : pas d'équipes ni de matchs auto (composition manuelle ensuite)
  if (cfg.mode === 'choisi') {
    return { teams: [], matches: [], unassignedCount: 0 }
  }

  let teams: FullTeamInput[] = []
  let unassignedCount = 0

  // Niveau cumulé par joueur (défaut neutre) pour l'équilibrage optionnel.
  const niveauById = new Map<string, number>()
  for (const p of combinedPlayers) niveauById.set(p.id, p.niveau ?? NIVEAU_BASE)

  if (cfg.format === 'tete_a_tete') {
    if (cfg.mode === 'melee_tournante') {
      // Équipes individuelles STABLES (ordre = allPlayerIds), préfixe R1-
      teams = allPlayerIds.map((pid, i) => ({ name: `R1-Équipe ${i + 1}`, joueur_ids: [pid] }))
    } else {
      // Mêlée fixe / poules : équipes individuelles mélangées
      const shuffled = TirageService.fisherYatesShuffle(allPlayerIds)
      teams = shuffled.map((pid, i) => ({ name: `Équipe ${i + 1}`, joueur_ids: [pid] }))
    }
  } else if (cfg.equilibrageNiveau && !cfg.mixiteObligatoire) {
    // ÉQUILIBRAGE PAR NIVEAU : composer des équipes homogènes (un fort avec un faible)
    // à partir de l'historique cumulé. Incompatible avec la mixité obligatoire (contrainte
    // de genre prioritaire) → dans ce cas on retombe sur la branche mixité ci-dessous.
    const balanced = balancedTeamsByLevel(
      combinedPlayers.map(p => ({ id: p.id, niveau: niveauById.get(p.id) })),
      playersPerTeam
    )
    unassignedCount = balanced.unassigned.length
    const prefix = cfg.mode === 'melee_tournante' ? 'R1-' : ''
    teams = balanced.teams.map((t, i) => ({
      name: prefix ? `${prefix}Équipe ${i + 1}` : `Équipe ${i + 1}`,
      joueur_ids: t.joueur_ids,
    }))
  } else {
    // Doublette / triplette : mixité
    const players = combinedPlayers as unknown as Joueur[]
    const mixiteResult = MixiteService.createTeamsWithMixite(
      players,
      playersPerTeam as 2 | 3,
      cfg.mixiteObligatoire
    )
    unassignedCount = mixiteResult.unassignedPlayerIds.length
    const prefix = cfg.mode === 'melee_tournante' ? 'R1-' : ''
    teams = mixiteResult.teams.map((t, i) => ({
      name: prefix ? `${prefix}Équipe ${i + 1}` : `Équipe ${i + 1}`,
      joueur_ids: t.joueur_ids,
    }))
  }

  // Équipes pour le tirage : id = index dans le tableau teams
  const teamsForDraw = teams.map((t, i) => ({ id: String(i), name: t.name, joueur_ids: t.joueur_ids }))
  const matches: FullMatchInput[] = []

  if (cfg.format === 'tete_a_tete' && cfg.mode === 'melee_tournante') {
    // Ronde 1 = première ronde de Berger (un match par joueur)
    const round1 = TirageService.bergerRoundForRotation(teamsForDraw, 1)
    const withTerrain = assignTerrains(
      round1.map(m => ({ a: Number(m.teamA.id), b: Number(m.teamB.id), tour: 1, poule: null as string | null })),
      cfg.terrains
    )
    for (const m of withTerrain) {
      matches.push({ team_a_index: m.a, team_b_index: m.b, tour: m.tour, terrain: m.terrain, type: 'poule', poule: m.poule, status: 'a_jouer' })
    }
  } else if (
    (cfg.mode === 'melee_tournante' && (cfg.mixiteAdversaire || cfg.nombreParties)) ||
    (cfg.mode === 'melee_fixe' && cfg.nombreParties)
  ) {
    // MODE « PARTIES » / MIXITÉ ADVERSAIRE : la partie 1 est UN match par équipe
    // (pas un round-robin de poules). Vaut aussi pour la MÊLÉE FIXE en N parties
    // (mêmes équipes, adversaires re-tirés à chaque partie) — sinon on générait des
    // poules au lieu de parties. Si mixité adversaire : appariement par profil de genre
    // compatible (jamais 2F+1H contre 2H+1F) ; sinon appariement simple.
    const genderById = new Map<string, 'H' | 'F'>()
    for (const p of combinedPlayers) genderById.set(p.id, p.gender === 'F' ? 'F' : 'H')
    const profiles = cfg.mixiteAdversaire
      ? teams.map(t => teamGenderProfile(t.joueur_ids, genderById))
      : teams.map(() => 'N' as const)
    const { pairs } = pairRoundByMixite(profiles)
    const withTerrain = assignTerrains(
      pairs.map(([a, b]) => ({ a, b, tour: 1, poule: null as string | null })),
      cfg.terrains
    )
    for (const m of withTerrain) {
      matches.push({ team_a_index: m.a, team_b_index: m.b, tour: m.tour, terrain: m.terrain, type: 'poule', poule: m.poule, status: 'a_jouer' })
    }
  } else {
    // Poules : distribution serpentin + planning Berger par poule.
    // Équilibrage par niveau : on ensemence les équipes par force décroissante puis on
    // laisse le serpentin les répartir (poules homogènes) au lieu d'un ordre aléatoire.
    const seeded = cfg.equilibrageNiveau
      ? seedTeamsByLevel(teamsForDraw, niveauById)
      : teamsForDraw
    const poules = TirageService.snakeDraftDistribution(seeded, cfg.pouleSize, !!cfg.equilibrageNiveau)
    const raw: Array<{ a: number; b: number; tour: number; poule: string | null }> = []
    for (const [pouleName, pouleTeams] of Object.entries(poules)) {
      const berger = TirageService.generateBergerMatches(pouleTeams, pouleName)
      for (const m of berger) {
        raw.push({ a: Number(m.teamA.id), b: Number(m.teamB.id), tour: m.tour, poule: m.poule })
      }
    }
    const withTerrain = assignTerrains(raw, cfg.terrains)
    for (const m of withTerrain) {
      matches.push({ team_a_index: m.a, team_b_index: m.b, tour: m.tour, terrain: m.terrain, type: 'poule', poule: m.poule, status: 'a_jouer' })
    }
  }

  return { teams, matches, unassignedCount }
}

/** Assigne les terrains via smartTerrainAssignment (ou null si aucun terrain). */
function assignTerrains(
  ms: Array<{ a: number; b: number; tour: number; poule: string | null }>,
  terrains: number
): Array<{ a: number; b: number; tour: number; poule: string | null; terrain: number | null }> {
  if (!terrains || terrains <= 0) {
    return ms.map(m => ({ ...m, terrain: null }))
  }
  const assignment = TirageService.smartTerrainAssignment(
    ms.map((m, idx) => ({ id: `m_${idx}`, equipe_a_id: String(m.a), equipe_b_id: String(m.b), tour: m.tour })),
    terrains
  )
  return ms.map((m, idx) => ({ ...m, terrain: assignment.get(`m_${idx}`) ?? null }))
}

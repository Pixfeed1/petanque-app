/**
 * Couche « Décris ton tournoi » — parseur DÉTERMINISTE (aucune IA, hors-ligne).
 *
 * Transforme une phrase en français en un pré-remplissage des réglages de
 * création. Le résultat est proposé à l'organisateur qui RELIT et confirme :
 * le langage naturel aide à SAISIR la config, il ne devient jamais la règle qui
 * tourne (l'exécution reste les réglages structurés, déterministes et testés).
 *
 * Choix assumé : parseur à mots-clés (et pas un LLM) pour être 100 % testable,
 * reproductible et fonctionnel sans connexion — contraintes fortes d'un concours.
 */

import type { TournamentFormData } from '@/hooks/tournament/useCreateTournament'
import { sanitizeTerrainNames } from '@/lib/tournament/terrains'

export interface ParsedTournament {
  /** Champs reconnus, à fusionner dans le formulaire. */
  fields: Partial<TournamentFormData>
  /** Libellés lisibles de ce qui a été compris (pour affichage/relecture). */
  detected: string[]
}

/** Minuscule + suppression des accents pour une correspondance robuste. */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Cherche un nombre suivi (ou précédé) d'un mot-clé. Renvoie le 1er trouvé. */
function findNumber(text: string, keyword: RegExp): number | null {
  const m = text.match(keyword)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) ? n : null
}

export function parseTournamentDescription(input: string): ParsedTournament {
  const fields: Partial<TournamentFormData> = {}
  const detected: string[] = []
  if (!input || !input.trim()) return { fields, detected }

  const t = normalize(input)

  // ── MODE ────────────────────────────────────────────────────────────
  // Ordre important : "melee tournante" contient "melee" → tester tournante d'abord.
  if (/\btournante?\b/.test(t)) {
    fields.mode = 'melee_tournante'
    detected.push('Mode : mêlée tournante')
  } else if (/\bchoisi\b|\bchoisies?\b|equipes? choisies?|je choisis/.test(t)) {
    fields.mode = 'choisi'
    detected.push('Mode : choisi')
  } else if (/\bmelee\b|\bmelees\b|melee (simple|fixe)/.test(t)) {
    fields.mode = 'melee_fixe'
    detected.push('Mode : mêlée simple')
  }

  // ── FORMAT ──────────────────────────────────────────────────────────
  if (/tete[ -]?a[ -]?tete|\bindividuel\b|tete a tete/.test(t)) {
    fields.format = 'tete_a_tete'
    detected.push('Format : tête-à-tête')
  } else if (/triplettes?|equipes? de 3|par 3\b/.test(t)) {
    fields.format = 'triplette'
    detected.push('Format : triplette')
  } else if (/doublettes?|equipes? de 2|par 2\b/.test(t)) {
    fields.format = 'doublette'
    detected.push('Format : doublette')
  }

  // ── POINTS (7–25) ───────────────────────────────────────────────────
  // Exige le mot "point(s)"/"pts" ou "jusqu'à N" pour ne PAS confondre avec
  // "12 joueurs" ou "4 terrains".
  const pts = findNumber(t, /(\d+)\s*(?:points?|pts?)\b/) ?? findNumber(t, /jusqu'?a\s+(\d+)/)
  if (pts !== null && pts >= 7 && pts <= 25) {
    fields.maxPoints = pts
    detected.push(`Points : ${pts}`)
  }

  // ── TERRAINS ────────────────────────────────────────────────────────
  // Nommés d'abord : « terrains A, B, 5 » / « sur les terrains a b c »
  const named = t.match(/terrains?\s+((?:[abc]|[3-9])(?:[\s,]+(?:et\s+)?(?:[abc]|[3-9]))*)/i)
  const terrainNames = named ? sanitizeTerrainNames(named[1].split(/[\s,]+|et/)) : []
  if (terrainNames.length > 0) {
    fields.terrainNames = terrainNames
    fields.terrains = terrainNames.length
    detected.push(`Terrains : ${terrainNames.join(', ')}`)
  } else {
    // Sinon un simple nombre : « 4 terrains »
    const terrains = findNumber(t, /(\d+)\s*terrains?/)
    if (terrains !== null && terrains >= 1 && terrains <= 10) {
      fields.terrains = terrains
      detected.push(`Terrains : ${terrains}`)
    }
  }

  // ── LIMITE DE TEMPS ─────────────────────────────────────────────────
  const minutes = findNumber(t, /(\d+)\s*(?:min\b|mins\b|minutes?)/)
  if (minutes !== null && minutes >= 5 && minutes <= 240) {
    fields.timeLimit = true
    fields.timeLimitMinutes = minutes
    detected.push(`Limite de temps : ${minutes} min`)
  } else if (/limite de temps|temps limite|\bchrono\b|minute par match/.test(t)) {
    fields.timeLimit = true
    detected.push('Limite de temps activée')
  }

  // ── NOMBRE DE PARTIES (2–4) ─────────────────────────────────────────
  const parties = findNumber(t, /(\d+)\s*parties?/) ?? findNumber(t, /en\s+(\d+)\s+manches?/)
  if (parties !== null && parties >= 2 && parties <= 4) {
    fields.nombreParties = parties
    detected.push(`Nombre de parties : ${parties}`)
  }

  // ── QUALIFIÉS PAR POULE (1–16) ──────────────────────────────────────
  const qual = findNumber(t, /(\d+)\s*qualifies?/) ?? findNumber(t, /les\s+(\d+)\s+premiers/)
  if (qual !== null && qual >= 1 && qual <= 16) {
    fields.qualifiedPerPoule = qual
    detected.push(`Qualifiés par poule : ${qual}`)
  }

  // ── OPTIONS BOOLÉENNES ──────────────────────────────────────────────
  if (/mixite des adversaires|adversaires? (equilibres?|mixtes?)|equilibre des adversaires/.test(t)) {
    fields.mixiteAdversaire = true
    detected.push('Mixité des adversaires')
  }
  if (/mixite|\bmixte\b|hommes? et femmes?|\bh et f\b|paritaire/.test(t)) {
    fields.mixiteObligatoire = true
    detected.push('Mixité obligatoire')
  }
  if (/petite finale|3e? ?place|3eme place|troisieme place|consolante|match pour la 3/.test(t)) {
    fields.consolante = true
    detected.push('Petite finale (3e place)')
  }
  if (/fair[ -]?play|esprit club/.test(t)) {
    fields.fairPlay = true
    detected.push('Mode fair-play')
  }
  if (/equilibr\w*\s+(par\s+)?niveau|niveau\s+cumul|selon\s+le\s+niveau|par\s+niveau|equipes?\s+equilibr/.test(t)) {
    fields.equilibrageNiveau = true
    detected.push('Équilibrage par niveau')
  }
  if (/double[ -]?elim/.test(t)) {
    fields.eliminationFormat = 'double'
    detected.push('Double élimination')
  }

  // ── ROTATION (mêlée tournante) ──────────────────────────────────────
  if (/par match|rotation par match/.test(t)) {
    fields.meleeRotation = 'par_match'
    detected.push('Rotation : par match')
  } else if (/par tour|rotation par tour/.test(t)) {
    fields.meleeRotation = 'par_tour'
    detected.push('Rotation : par tour')
  }

  return { fields, detected }
}

export default parseTournamentDescription

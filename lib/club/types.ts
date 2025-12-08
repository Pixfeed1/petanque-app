// lib/club/types.ts
// Types pour le système de règles personnalisées Pack Club
// Séparé du système de tournoi standard

// ============================================
// CONFIGURATION DES RÈGLES CLUB
// ============================================

/**
 * Mode de jeu du tournoi
 */
export type ClubMode = 'choisi' | 'melee' | 'melee_tournante'

/**
 * Format d'équipe
 */
export type ClubFormat = 'doublette' | 'triplette'

/**
 * Méthode de classement
 */
export type ClubClassementMethode = 'victoires_puis_points' | 'points_puis_victoires' | 'difference_points'

/**
 * Règles de mixité H/F avancées
 */
export interface ClubMixiteRules {
  /** Activer la gestion H/F */
  enabled: boolean
  /** Jamais 3 personnes du même genre dans une équipe triplette */
  jamaisTroisMemeGenre: boolean
  /** 2F1H ne joue jamais contre 2H1F (et vice versa) */
  equilibreMatchsHF: boolean
  /** Priorité à la mixité dans le tirage */
  prioriteMixite: boolean
}

/**
 * Configuration des terrains
 */
export interface ClubTerrainsConfig {
  /** Liste des noms de terrains (ex: ["A", "B", "C", "3", "4", "5"]) */
  noms: string[]
  /** Attribution automatique ou manuelle */
  attributionAuto: boolean
}

/**
 * Configuration du classement
 */
export interface ClubClassementConfig {
  /** Méthode de classement principale */
  methode: ClubClassementMethode
  /** Points pour une victoire (par défaut 13) */
  pointsVictoire: number
  /** Calcul par différence (ex: gagné 13-4 = +9) */
  calculDifference: boolean
}

/**
 * Règles personnalisées complètes d'un club
 */
export interface ClubRules {
  /** ID unique des règles */
  id: string
  /** ID de l'utilisateur propriétaire (Pack Club) */
  userId: string
  /** Nom du jeu de règles (ex: "Règlement Club Pétanque Lyon") */
  name: string
  /** Description optionnelle */
  description?: string

  // --- Configuration du tournoi ---

  /** Mode de jeu par défaut */
  mode: ClubMode
  /** Format d'équipe par défaut */
  format: ClubFormat
  /** Nombre de parties (2, 3 ou 4) */
  nombreParties: 2 | 3 | 4
  /** Points pour gagner une partie */
  pointsGagnants: 11 | 13 | 15 | 21

  // --- Règles avancées ---

  /** Configuration mixité H/F */
  mixite: ClubMixiteRules
  /** Configuration des terrains */
  terrains: ClubTerrainsConfig
  /** Configuration du classement */
  classement: ClubClassementConfig

  // --- Gestion nombres impairs ---

  /** Autoriser mélange doublette/triplette si nombre impair */
  autoriserMelangeFormats: boolean
  /** En triplette, privilégier les triplettes (doublettes en dernier recours) */
  privilegierFormatPrincipal: boolean

  // --- Métadonnées ---

  createdAt: string
  updatedAt: string
}

/**
 * Règles par défaut (utilisées si pas de Pack Club)
 */
export const DEFAULT_CLUB_RULES: Omit<ClubRules, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: 'Règles standard',
  mode: 'melee',
  format: 'doublette',
  nombreParties: 3,
  pointsGagnants: 13,
  mixite: {
    enabled: false,
    jamaisTroisMemeGenre: true,
    equilibreMatchsHF: false,
    prioriteMixite: false
  },
  terrains: {
    noms: ['1', '2', '3', '4', '5', '6'],
    attributionAuto: true
  },
  classement: {
    methode: 'victoires_puis_points',
    pointsVictoire: 13,
    calculDifference: true
  },
  autoriserMelangeFormats: true,
  privilegierFormatPrincipal: true
}

// ============================================
// TYPES POUR LE TIRAGE
// ============================================

/**
 * Joueur avec genre pour le tirage
 */
export interface ClubJoueur {
  id: string
  name: string
  gender: 'H' | 'F'
}

/**
 * Équipe formée par le tirage
 */
export interface ClubEquipe {
  id: string
  joueurIds: string[]
  /** Composition genre (ex: "2H1F", "1H1F", "3H") */
  compositionGenre: string
}

/**
 * Match avec les contraintes de genre
 */
export interface ClubMatch {
  equipeAId: string
  equipeBId: string
  terrain: string
  tour: number
  /** Valide selon les règles H/F */
  valideHF: boolean
}

/**
 * Résultat du tirage
 */
export interface ClubTirageResult {
  equipes: ClubEquipe[]
  matchs: ClubMatch[]
  joueursNonAssignes: string[]
  warnings: string[]
}

// ============================================
// TYPES POUR LE CLASSEMENT
// ============================================

/**
 * Score d'une partie
 */
export interface ClubPartieScore {
  partieNum: number
  scoreEquipe: number
  scoreAdversaire: number
  /** Différence calculée (+9, -8, etc.) */
  difference: number
  victoire: boolean
}

/**
 * Classement d'un joueur/équipe
 */
export interface ClubClassementEntry {
  joueurId?: string
  equipeId?: string
  nom: string
  parties: ClubPartieScore[]
  /** Total des différences */
  totalDifference: number
  /** Nombre de victoires */
  victoires: number
  /** Nombre de défaites */
  defaites: number
  /** Position au classement */
  position: number
}

/**
 * Classement complet du tournoi
 */
export interface ClubClassement {
  entries: ClubClassementEntry[]
  /** Méthode utilisée pour le tri */
  methode: ClubClassementMethode
}

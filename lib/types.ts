// lib/types.ts
// Types pour les modèles de base de données

// Stats d'une équipe
export interface EquipeStats {
  victoires: number
  defaites: number
  nuls?: number // Égalités
  points_pour: number
  points_contre: number
  difference?: number
  points_fipjp?: number // Victoires × 3 + Nuls × 1
}

export interface Equipe {
  id: string
  tournoi_id: string
  name: string
  joueur_ids: string[] // UUID[]
  poule?: string // Nom de la poule
  stats?: EquipeStats
  created_at?: string
  updated_at?: string
}

export interface Joueur {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  stats?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Match {
  id: string
  tournoi_id: string
  equipe_a_id: string | null
  equipe_b_id: string | null
  equipe_a?: Equipe | null
  equipe_b?: Equipe | null
  score_a: number | null
  score_b: number | null
  status: MatchStatus
  tour: number
  terrain: number | null
  type: MatchType
  poule: string | null
  round: string | null
  manches_json: Manche[] | null
  started_at: string | null
  ended_at: string | null
  validated_at: string | null
  played_at: string | null
  proposed_by: string | null
  proposed_at: string | null
  winner_id: string | null
  created_at: string
  updated_at: string
}

export interface MatchWithEquipes extends Omit<Match, 'equipe_a' | 'equipe_b'> {
  equipe_a: EquipeSimple | null
  equipe_b: EquipeSimple | null
  tournoi?: TournoiSimple | null
}

export interface EquipeSimple {
  id: string
  name: string
  joueur_ids: string[]
}

export interface EquipeJoueur {
  joueur: Joueur
  role: string
}

export interface TournoiSimple {
  id: string
  name: string
}

export interface Manche {
  scoreA: number
  scoreB: number
}

export type MatchStatus =
  | 'a_jouer'
  | 'en_cours'
  | 'termine'
  | 'en_attente_validation'
  | 'valide'

export type MatchType =
  | 'poule'
  | 'elimination'
  | 'petite_finale'
  | 'finale'
  | 'demi'
  | 'quart'
  | 'huitieme'
  | 'bye'

// Type pour les lignes brutes de la base de données (avant transformation)
export interface MatchRawDB {
  id: string
  tournoi_id: string
  equipe_a_id: string | null
  equipe_b_id: string | null
  equipe_a_id_check?: string | null
  equipe_a_name?: string | null
  equipe_a_joueur_ids?: string[] | null
  equipe_b_id_check?: string | null
  equipe_b_name?: string | null
  equipe_b_joueur_ids?: string[] | null
  tournoi_id_check?: string | null
  tournoi_name?: string | null
  tournoi_org_id?: string | null
  score_a: number | null
  score_b: number | null
  status: string
  tour: number
  terrain: number | null
  type: string
  poule: string | null
  round: string | null
  manches_json: string | null
  started_at: string | null
  ended_at: string | null
  validated_at: string | null
  played_at: string | null
  proposed_by: string | null
  proposed_at: string | null
  winner_id: string | null
  created_at: string
  updated_at: string
}

// Types pour le mode et format de tournoi
export type TournoiMode = 'choisi' | 'melee_fixe' | 'melee_tournante'
export type TournoiFormat = 'tete_a_tete' | 'doublette' | 'triplette'
export type MeleeRotation = 'par_tour' | 'par_match'
export type EliminationFormat = 'simple' | 'double'

// Settings précis pour un tournoi
export interface TournoiSettings {
  maxPoints: number // Défaut: 13
  pouleSize?: number // Nombre d'équipes par poule
  qualifiedPerPoule?: number // Nombre de qualifiés par poule pour les finales
  eliminationFormat?: EliminationFormat
  meleeRotation?: MeleeRotation // Pour mêlée tournante
  mixiteObligatoire?: boolean // Forcer H/F dans les équipes
  consolante?: boolean // Match pour la 3ème place
  terrains: number // Nombre de terrains disponibles
  players?: string[] // IDs des joueurs sélectionnés
  melee_tournante_players?: string[] // IDs pour rotation mêlée
  current_round?: number // Tour actuel (pour mêlée tournante)
}

export interface Tournoi {
  id: string
  org_id: string | null
  name: string
  date_debut: string
  date_fin: string | null
  lieu: string | null
  mode: TournoiMode
  format: TournoiFormat
  terrains: number
  status: TournoiStatus
  max_points: number
  settings: TournoiSettings
  created_at: string
  updated_at: string
}

export type TournoiStatus =
  | 'preparation'
  | 'en_cours'
  | 'termine'
  | 'annule'

export interface User {
  id: string
  email: string
  full_name?: string | null
  email_verified?: boolean
  org_id?: string | null
  metadata?: UserMetadata | null
  created_at?: string
  updated_at?: string
  last_login_at?: string | null
}

export interface UserMetadata {
  subscription?: {
    status: 'free' | 'premium'
    plan: 'free' | 'premium_yearly'
    stripe_customer_id?: string
    stripe_subscription_id?: string
    premium_since?: string
    current_period_end?: string
    // Pack Club addon (9.99€)
    pack_club?: {
      active: boolean
      purchased_at?: string
      stripe_subscription_id?: string
      expires_at?: string
    }
  }
  preferences?: {
    theme?: 'light' | 'dark'
    notifications?: boolean
  }
}

// ============================================
// ORGANISATIONS
// ============================================

export interface Organisation {
  id: string
  name: string
  created_at: string
  settings?: OrganisationSettings
}

export interface OrganisationSettings {
  plan: 'free' | 'premium'
  pack_club?: boolean // Addon règles personnalisées (9.99€)
  features?: {
    max_tournois?: number
    max_joueurs?: number
    export_enabled?: boolean
  }
}

// ============================================
// DASHBOARD & STATS
// ============================================

export interface DashboardStats {
  totalTournois: number
  totalJoueurs: number
  totalMatchs: number
  tournoiEnCours: number
  nouveauxTournois: number
  nouveauxJoueurs: number
  nouveauxMatchs: number
}

export interface ActionItem {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  label: string
  labelColor: string
  url: string
}

export interface PlayerStats {
  id: string
  nom: string
  prenom: string
  victories: number
  defeats: number
  matchsJoues: number
  points: number
  pointsMarques: number
  pointsEncaisses: number
  difference: number
  equipes: string[]
}

export interface EquipeWithStats extends Equipe {
  victories: number
  defeats: number
  matchsJoues: number
  points: number
  pointsMarques: number
  pointsEncaisses: number
  difference: number
}

// ============================================
// PAIEMENTS & STRIPE
// ============================================

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface PaymentAttempt {
  id: string
  user_id: string
  stripe_session_id: string
  stripe_customer_id?: string | null
  stripe_payment_intent?: string | null
  stripe_subscription_id?: string | null
  amount: number
  currency: string
  status: PaymentStatus
  created_at: string
  completed_at?: string | null
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  status: number
  timestamp?: string
  details?: unknown
}

// ============================================
// HOOKS & STATE
// ============================================

export interface UseDashboardDataReturn {
  loading: boolean
  stats: DashboardStats
  tournois: Tournoi[]
  recentMatches: Match[]
  refetch: () => Promise<void>
}

export interface UseAuthReturn {
  user: User | null
  organization: Organisation | null
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

// ============================================
// UTILITAIRES
// ============================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Types pour les paramètres SQL
export type SQLValue = string | number | boolean | null | string[] | Record<string, unknown>

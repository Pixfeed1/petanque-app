// lib/types.ts
// Types pour les modèles de base de données

export interface Equipe {
  id: string
  tournoi_id: string
  name: string
  joueur_ids: string[] // UUID[]
  stats?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Joueur {
  id: string
  name: string
  email?: string
  phone?: string
  stats?: Record<string, unknown>
}

export interface Match {
  id: string
  tournoi_id: string
  equipe_a_id: string | null
  equipe_b_id: string | null
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

export interface MatchWithEquipes extends Match {
  equipe_a: EquipeSimple | null
  equipe_b: EquipeSimple | null
  tournoi?: TournoiSimple | null
}

export interface EquipeSimple {
  id: string
  name: string
  joueur_ids: string[]
}

export interface TournoiSimple {
  id: string
  name: string
}

export interface Manche {
  equipe_a: number
  equipe_b: number
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

export interface Tournoi {
  id: string
  org_id: string | null
  name: string
  date_debut: string
  date_fin: string | null
  lieu: string | null
  mode: string
  format: string
  terrains: number
  status: TournoiStatus
  max_points: number
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
  name?: string
  created_at?: string
  updated_at?: string
}

// Types pour les paramètres SQL
export type SQLValue = string | number | boolean | null | string[] | Record<string, unknown>

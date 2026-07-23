// lib/validations.ts
// Schémas de validation Zod pour toutes les APIs

import { z } from 'zod'

// ============================================
// HELPERS: Validation UUID ou Integer
// ============================================

// Accepte UUID ou integer pour compatibilité avec DB legacy
export const idSchema = z.string().refine((val) => {
  // Accepte les UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(val)) return true

  // Accepte les integers
  if (/^\d+$/.test(val)) return true

  return false
}, 'ID invalide (UUID ou nombre attendu)')

// ============================================
// AUTHENTIFICATION
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
})

export const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().optional(),
  organizationName: z.string().optional()
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide')
})

export const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token manquant'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})

// ============================================
// JOUEURS
// ============================================

export const createJoueurSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  gender: z.enum(['H', 'F']).optional().nullable(),
  org_id: idSchema
})

export const updateJoueurSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100).optional(),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  gender: z.enum(['H', 'F']).optional().nullable()
})

export const joueurIdSchema = z.object({
  id: idSchema
})

// ============================================
// ÉQUIPES
// ============================================

export const createEquipeSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100),
  tournoi_id: idSchema,
  joueur_ids: z.array(idSchema).min(1, 'Au moins un joueur requis')
})

export const updateEquipeSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(100).optional(),
  joueur_ids: z.array(idSchema).optional()
})

export const equipeIdSchema = z.object({
  id: idSchema
})

// ============================================
// TOURNOIS
// ============================================

export const createTournoiSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(200),
  date_debut: z.string().datetime('Date de début invalide'),
  date_fin: z.string().datetime('Date de fin invalide').optional().nullable(),
  lieu: z.string().max(200).optional().nullable(),
  mode: z.enum(['choisi', 'melee_fixe', 'melee_tournante'], {
    message: 'Mode invalide (choisi, melee_fixe ou melee_tournante)'
  }),
  format: z.enum(['tete_a_tete', 'doublette', 'triplette'], {
    message: 'Format invalide (tete_a_tete, doublette ou triplette)'
  }),
  terrains: z.number().int().min(1, 'Au moins 1 terrain requis').max(50),
  max_points: z.number().int().min(1, 'Au moins 1 point requis').max(50),
  org_id: idSchema
})

export const updateTournoiSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date_fin: z.string().datetime().optional().nullable(),
  lieu: z.string().max(200).optional().nullable(),
  status: z.enum(['preparation', 'en_cours', 'termine', 'annule']).optional(),
  terrains: z.number().int().min(1).max(50).optional(),
  max_points: z.number().int().min(1).max(50).optional()
})

export const tournoiIdSchema = z.object({
  id: idSchema
})

// ============================================
// MATCHS
// ============================================

export const matchStatusEnum = z.enum(['a_jouer', 'en_cours', 'termine', 'en_attente_validation', 'valide'])
export const matchTypeEnum = z.enum(['poule', 'elimination', 'petite_finale', 'finale', 'demi', 'quart', 'huitieme', 'bye'])

export const mancheSchema = z.object({
  scoreA: z.number().int().min(0).max(50),
  scoreB: z.number().int().min(0).max(50)
})

export const createMatchSchema = z.object({
  tournoi_id: idSchema,
  equipe_a_id: idSchema.nullable(),
  equipe_b_id: idSchema.nullable(),
  tour: z.number().int().min(1),
  terrain: z.number().int().min(1).nullable(),
  type: matchTypeEnum,
  poule: z.string().max(10).nullable(),
  round: z.string().max(50).nullable()
})

export const updateMatchSchema = z.object({
  score_a: z.number().int().min(0).max(50).optional(),
  score_b: z.number().int().min(0).max(50).optional(),
  status: matchStatusEnum.optional(),
  manches_json: z.array(mancheSchema).optional(),
  started_at: z.string().datetime().optional().nullable(),
  ended_at: z.string().datetime().optional().nullable(),
  validated_at: z.string().datetime().optional().nullable(),
  played_at: z.string().datetime().optional().nullable(),
  proposed_by: idSchema.optional().nullable(),
  proposed_at: z.string().datetime().optional().nullable(),
  winner_id: idSchema.optional().nullable()
})

export const matchIdSchema = z.object({
  id: idSchema
})

// (Schémas Stripe createCheckoutSessionSchema / verifyPaymentSchema retirés :
//  code mort depuis la suppression du paiement/plans sur cette branche.)

// ============================================
// QUERY PARAMETERS
// ============================================

export const orgIdQuerySchema = z.object({
  org_id: idSchema
})

export const tournoiIdQuerySchema = z.object({
  tournoi_id: idSchema
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

// ============================================
// HELPER: Validation avec gestion d'erreurs
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => {
        const path = err.path.join('.')
        return path ? `${path}: ${err.message}` : err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Erreur de validation inconnue'] }
  }
}

// ============================================
// REVIEWS
// ============================================

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1, 'Note minimum 1').max(5, 'Note maximum 5'),
  content: z.string().min(10, 'Au moins 10 caractères').max(500, 'Maximum 500 caractères'),
  name: z.string().min(1, 'Le nom est obligatoire').max(100),
  role: z.string().max(100).optional().nullable()
})

export const moderateReviewSchema = z.object({
  review_id: z.coerce.number().int().min(1),
  action: z.enum(['approve', 'reject'])
})

// ============================================
// BATCH OPERATIONS
// ============================================

export const batchCreateEquipesSchema = z.object({
  tournoi_id: idSchema,
  equipes: z.array(createEquipeSchema.omit({ tournoi_id: true })).min(1).max(100)
})

export const batchUpdateMatchesSchema = z.object({
  updates: z.array(
    z.object({
      id: idSchema,
      data: updateMatchSchema
    })
  ).min(1).max(50)
})

// ============================================
// ORGANISATIONS
// ============================================

export const updateOrgSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown())
})

// ============================================
// FEEDBACK
// ============================================

export const submitFeedbackSchema = z.object({
  message: z.string().min(5, 'Au moins 5 caractères').max(2000, 'Maximum 2000 caractères'),
  category: z.enum(['general', 'bug', 'feature', 'ux']).optional().default('general')
})

export const replyFeedbackSchema = z.object({
  feedback_id: z.coerce.number().int().min(1),
  admin_reply: z.string().min(1).max(2000).optional(),
  status: z.enum(['new', 'read', 'replied', 'archived']).optional()
})

// ============================================
// SANITIZATION DES SETTINGS DE TOURNOI
// ============================================
// FIX SÉCURITÉ : le POST/PUT tournois faisait `{ ...defaults, ...settings }`
// sans whitelist (mass assignment) ni coercition de type. Un appel API direct
// pouvait injecter pouleSize:0, terrains:-5, maxPoints:"abc"/NaN, ou des clés
// parasites. Ce helper coerce et borne les clés connues et ignore les inconnues.

type SettingsInput = Record<string, unknown>

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

/**
 * Nettoie un objet de settings de tournoi : coercition + bornes sur les clés
 * connues, whitelist stricte (les clés inconnues sont ignorées). Ne fixe PAS
 * les valeurs par défaut absentes (utiliser `{ ...defaults, ...sanitize(x) }`
 * en création, ou merger avec l'existant en mise à jour).
 */
export function sanitizeTournoiSettings(input: unknown): SettingsInput {
  const src: SettingsInput = (input && typeof input === 'object') ? input as SettingsInput : {}
  const out: SettingsInput = {}

  // Numériques bornés
  if ('terrains' in src) out.terrains = clampInt(src.terrains, 1, 50, 4)
  if ('maxPoints' in src) out.maxPoints = clampInt(src.maxPoints, 7, 25, 13)
  if ('pouleSize' in src) out.pouleSize = clampInt(src.pouleSize, 2, 12, 4)
  if ('timeLimitMinutes' in src) out.timeLimitMinutes = clampInt(src.timeLimitMinutes, 5, 240, 60)
  if ('qualifiedPerPoule' in src) out.qualifiedPerPoule = clampInt(src.qualifiedPerPoule, 1, 16, 2)
  if ('current_round' in src) out.current_round = clampInt(src.current_round, 1, 100, 1)

  // Booléens
  for (const key of ['timeLimit', 'consolante', 'fairPlay', 'recordMenes', 'allowPhotos', 'sendNotifications', 'mixiteObligatoire', 'mixiteAdversaire', 'poules_created'] as const) {
    if (key in src) out[key] = toBool(src[key])
  }

  // Chaînes bornées / énumérées
  if ('date' in src && typeof src.date === 'string') out.date = src.date.slice(0, 32)
  if ('time' in src && typeof src.time === 'string') out.time = src.time.slice(0, 16)
  if ('location' in src && typeof src.location === 'string') out.location = src.location.slice(0, 255)
  if ('eliminationFormat' in src && (src.eliminationFormat === 'simple' || src.eliminationFormat === 'double')) {
    out.eliminationFormat = src.eliminationFormat
  }
  if ('meleeRotation' in src && (src.meleeRotation === 'par_tour' || src.meleeRotation === 'par_match')) {
    out.meleeRotation = src.meleeRotation
  }
  if ('visibility' in src && (src.visibility === 'private' || src.visibility === 'public')) {
    out.visibility = src.visibility
  }

  // Listes d'IDs de joueurs (bornées, éléments primitifs uniquement)
  for (const key of ['players', 'melee_tournante_players'] as const) {
    if (key in src && Array.isArray(src[key])) {
      out[key] = (src[key] as unknown[])
        .filter(v => typeof v === 'string' || typeof v === 'number')
        .slice(0, 512)
        .map(String)
    }
  }

  return out
}

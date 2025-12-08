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
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  fullName: z.string().optional(),
  organizationName: z.string().optional()
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide')
})

export const updatePasswordSchema = z.object({
  token: z.string().min(1, 'Token manquant'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
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
  mode: z.enum(['choisi', 'melee_tournante'], {
    message: 'Mode invalide (choisi ou melee_tournante)'
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
export const matchTypeEnum = z.enum(['poule', 'elimination', 'petite_finale', 'finale'])

export const mancheSchema = z.object({
  equipe_a: z.number().int().min(0).max(50),
  equipe_b: z.number().int().min(0).max(50)
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

// ============================================
// PAIEMENTS STRIPE
// ============================================

export const createCheckoutSessionSchema = z.object({
  userId: idSchema,
  userEmail: z.string().email('Email invalide'),
  priceId: z.string().optional().nullable(),
  product: z.enum(['premium', 'pack_club']).optional().default('premium')
})

export const verifyPaymentSchema = z.object({
  session_id: z.string().min(1, 'Session ID manquant')
})

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

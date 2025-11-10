-- ===================================
-- Migration: Correction joueur_ids de UUID[] vers BIGINT[]
-- Date: 2025-11-10
-- Description: Corrige le type de joueur_ids pour matcher joueurs.id (bigint)
-- ===================================

-- 1. Vider temporairement la colonne
UPDATE equipes SET joueur_ids = NULL;

-- 2. Supprimer le DEFAULT actuel
ALTER TABLE equipes ALTER COLUMN joueur_ids DROP DEFAULT;

-- 3. Convertir de UUID[] vers BIGINT[]
ALTER TABLE equipes
ALTER COLUMN joueur_ids TYPE BIGINT[]
USING NULL::BIGINT[];

-- 4. Remettre le DEFAULT correct
ALTER TABLE equipes
ALTER COLUMN joueur_ids SET DEFAULT ARRAY[]::BIGINT[];

-- 5. Initialiser les valeurs vides avec un tableau vide
UPDATE equipes SET joueur_ids = ARRAY[]::BIGINT[] WHERE joueur_ids IS NULL;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 005 appliquée: joueur_ids converti de UUID[] vers BIGINT[]';
END $$;

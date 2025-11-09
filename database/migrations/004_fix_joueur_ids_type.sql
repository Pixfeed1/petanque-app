-- ===================================
-- Migration: Conversion joueur_ids de JSONB vers UUID[]
-- Date: 2025-11-09
-- Description: Convertit la colonne joueur_ids de JSONB en UUID[] pour améliorer les performances
-- ===================================

-- Fonction de conversion temporaire
CREATE OR REPLACE FUNCTION jsonb_array_to_uuid_array(jsonb_arr JSONB)
RETURNS UUID[] AS $$
DECLARE
  result UUID[];
  item TEXT;
BEGIN
  IF jsonb_arr IS NULL OR jsonb_arr = '[]'::jsonb THEN
    RETURN ARRAY[]::uuid[];
  END IF;

  SELECT ARRAY_AGG(elem::text::uuid)
  INTO result
  FROM jsonb_array_elements_text(jsonb_arr) elem;

  RETURN COALESCE(result, ARRAY[]::uuid[]);
END;
$$ LANGUAGE plpgsql;

-- Créer une colonne temporaire
ALTER TABLE equipes ADD COLUMN joueur_ids_new UUID[];

-- Migrer les données
UPDATE equipes SET joueur_ids_new = jsonb_array_to_uuid_array(joueur_ids);

-- Supprimer l'ancienne colonne et renommer la nouvelle
ALTER TABLE equipes DROP COLUMN joueur_ids;
ALTER TABLE equipes RENAME COLUMN joueur_ids_new TO joueur_ids;

-- Définir la valeur par défaut
ALTER TABLE equipes ALTER COLUMN joueur_ids SET DEFAULT ARRAY[]::uuid[];

-- Supprimer la fonction temporaire
DROP FUNCTION jsonb_array_to_uuid_array;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 appliquée: joueur_ids converti de JSONB vers UUID[]';
END $$;

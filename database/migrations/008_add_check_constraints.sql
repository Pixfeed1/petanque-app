-- ===================================
-- Migration 008 : Contraintes d'intégrité (CHECK) + colonne round
-- Date: 2026-07-10
-- Description : ajoute des garde-fous en base pour empêcher les états invalides
--   (scores négatifs, statuts/types arbitraires) — la validation n'était
--   jusqu'ici qu'applicative et contournable via SQL direct ou /matches/batch.
--   NOT VALID : appliqué aux nouvelles écritures sans échouer sur d'éventuelles
--   lignes legacy.
-- ===================================

-- Colonne round (ajoutée par 007 ; idempotent ici pour les bases nouid nues)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);

-- Scores : jamais négatifs
ALTER TABLE matches DROP CONSTRAINT IF EXISTS chk_matches_score_a_positive;
ALTER TABLE matches ADD CONSTRAINT chk_matches_score_a_positive
  CHECK (score_a IS NULL OR score_a >= 0) NOT VALID;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS chk_matches_score_b_positive;
ALTER TABLE matches ADD CONSTRAINT chk_matches_score_b_positive
  CHECK (score_b IS NULL OR score_b >= 0) NOT VALID;

-- Statut : ensemble fermé (inclut les statuts double-validation et les slots
-- 'en_attente' de la double élimination)
ALTER TABLE matches DROP CONSTRAINT IF EXISTS chk_matches_status;
ALTER TABLE matches ADD CONSTRAINT chk_matches_status
  CHECK (status IN (
    'a_jouer', 'en_cours', 'termine',
    'en_attente', 'en_attente_validation', 'valide'
  )) NOT VALID;

-- Type : ensemble fermé + slots de double élimination (préfixe 'de:')
ALTER TABLE matches DROP CONSTRAINT IF EXISTS chk_matches_type;
ALTER TABLE matches ADD CONSTRAINT chk_matches_type
  CHECK (
    type IS NULL OR
    type IN (
      'poule', 'bye', 'elimination',
      'huitieme', 'quart', 'demi', 'finale', 'petite_finale'
    ) OR
    type LIKE 'de:%'
  ) NOT VALID;

-- Statut de tournoi : ensemble fermé
ALTER TABLE tournois DROP CONSTRAINT IF EXISTS chk_tournois_status;
ALTER TABLE tournois ADD CONSTRAINT chk_tournois_status
  CHECK (status IN ('preparation', 'en_cours', 'termine')) NOT VALID;

-- Index manquant : winner_id (utilisé par le SET NULL lors d'une suppression d'équipe)
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);

DO $$
BEGIN
  RAISE NOTICE 'Migration 008 appliquée : contraintes CHECK + index winner_id';
END $$;

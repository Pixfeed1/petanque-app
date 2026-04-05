-- Migration 007: Ajouter la colonne round à la table matches
-- Utilisée pour identifier le tour d'élimination (huitieme, quart, demi, finale, petite_finale)

ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);

-- ===================================
-- Migration: Ajout des champs de validation de score
-- Date: 2025-11-09
-- Description: Ajoute les colonnes pour le système de double validation des scores
-- ===================================

-- Ajouter les colonnes pour la validation
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS proposed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMP;

-- Ajouter un commentaire sur les colonnes
COMMENT ON COLUMN matches.proposed_by IS 'ID de l''utilisateur qui a proposé le score (pour validation)';
COMMENT ON COLUMN matches.proposed_at IS 'Date et heure de proposition du score';

-- Mettre à jour le commentaire sur le statut pour inclure le nouveau statut
COMMENT ON COLUMN matches.status IS 'Statut du match: a_jouer, en_cours, termine, en_attente_validation';

-- Index pour optimiser les requêtes de validation
CREATE INDEX IF NOT EXISTS idx_matches_proposed_by ON matches(proposed_by);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 003 appliquée: colonnes de validation ajoutées';
END $$;

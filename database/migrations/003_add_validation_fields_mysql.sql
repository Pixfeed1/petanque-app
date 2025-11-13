-- ===================================
-- Migration: Ajout des champs de validation de score (MySQL)
-- Date: 2025-11-09
-- Description: Ajoute les colonnes pour le système de double validation des scores
-- ===================================

-- Ajouter les colonnes pour la validation si elles n'existent pas
ALTER TABLE matches
ADD COLUMN proposed_by CHAR(36) NULL COMMENT 'ID de l\'utilisateur qui a proposé le score (pour validation)',
ADD COLUMN proposed_at TIMESTAMP NULL COMMENT 'Date et heure de proposition du score',
ADD CONSTRAINT fk_matches_proposed_by FOREIGN KEY (proposed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Index pour optimiser les requêtes de validation
CREATE INDEX idx_matches_proposed_by ON matches(proposed_by);
CREATE INDEX idx_matches_status ON matches(status);

-- Note: Le statut 'en_attente_validation' peut maintenant être utilisé
SELECT 'Migration 003 appliquée: colonnes de validation ajoutées' AS message;

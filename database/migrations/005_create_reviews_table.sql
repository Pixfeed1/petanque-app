-- ===================================
-- Migration: Création de la table reviews
-- Date: 2025-11-13
-- Description: Système complet d'avis utilisateurs (web + stores)
-- ===================================

-- Création de la table reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  source VARCHAR(50) NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'google_play', 'app_store')),
  approved BOOLEAN NOT NULL DEFAULT false,
  external_id VARCHAR(255), -- ID de l'avis sur le store externe (pour éviter les doublons)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Commentaires sur les colonnes
COMMENT ON TABLE reviews IS 'Avis utilisateurs provenant du web, Google Play ou App Store';
COMMENT ON COLUMN reviews.user_id IS 'ID utilisateur (NULL si avis externe des stores)';
COMMENT ON COLUMN reviews.rating IS 'Note de 1 à 5 étoiles';
COMMENT ON COLUMN reviews.content IS 'Contenu texte de l''avis';
COMMENT ON COLUMN reviews.name IS 'Nom affiché publiquement (ex: "Jean-Pierre M.")';
COMMENT ON COLUMN reviews.role IS 'Rôle/description (ex: "Président club de Marseille")';
COMMENT ON COLUMN reviews.source IS 'Origine: web, google_play ou app_store';
COMMENT ON COLUMN reviews.approved IS 'Avis approuvé par un admin (false par défaut)';
COMMENT ON COLUMN reviews.external_id IS 'ID externe pour éviter doublons stores';
COMMENT ON COLUMN reviews.approved_by IS 'Admin qui a approuvé l''avis';

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_external_id ON reviews(external_id) WHERE external_id IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 005 appliquée: table reviews créée avec succès';
END $$;

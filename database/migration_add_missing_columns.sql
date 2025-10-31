-- =====================================================
-- MIGRATION: Ajouter les colonnes manquantes
-- Date: 2025-10-31
-- Description: Mise à jour du schéma pour correspondre au code frontend
-- =====================================================

-- Exécutez ce script sur votre base PostgreSQL EXISTANTE
-- Si vous créez une nouvelle base, utilisez schema.sql directement

BEGIN;

-- ===================================
-- 1. TABLE JOUEURS - Ajouter gender
-- ===================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'joueurs' AND column_name = 'gender'
    ) THEN
        ALTER TABLE joueurs ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('H', 'F'));
        CREATE INDEX idx_joueurs_gender ON joueurs(gender);
        RAISE NOTICE 'Colonne gender ajoutée à joueurs';
    ELSE
        RAISE NOTICE 'Colonne gender existe déjà dans joueurs';
    END IF;
END $$;

-- ===================================
-- 2. TABLE MATCHES - Ajouter colonnes manquantes
-- ===================================

-- Colonne type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'type'
    ) THEN
        ALTER TABLE matches ADD COLUMN type VARCHAR(50);
        CREATE INDEX idx_matches_type ON matches(type);
        RAISE NOTICE 'Colonne type ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne type existe déjà dans matches';
    END IF;
END $$;

-- Colonne poule
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'poule'
    ) THEN
        ALTER TABLE matches ADD COLUMN poule VARCHAR(10);
        CREATE INDEX idx_matches_poule ON matches(poule);
        RAISE NOTICE 'Colonne poule ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne poule existe déjà dans matches';
    END IF;
END $$;

-- Colonne manches_json
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'manches_json'
    ) THEN
        ALTER TABLE matches ADD COLUMN manches_json JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Colonne manches_json ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne manches_json existe déjà dans matches';
    END IF;
END $$;

-- Colonne started_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE matches ADD COLUMN started_at TIMESTAMP;
        RAISE NOTICE 'Colonne started_at ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne started_at existe déjà dans matches';
    END IF;
END $$;

-- Colonne ended_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'ended_at'
    ) THEN
        ALTER TABLE matches ADD COLUMN ended_at TIMESTAMP;
        RAISE NOTICE 'Colonne ended_at ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne ended_at existe déjà dans matches';
    END IF;
END $$;

-- Colonne validated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'validated_at'
    ) THEN
        ALTER TABLE matches ADD COLUMN validated_at TIMESTAMP;
        RAISE NOTICE 'Colonne validated_at ajoutée à matches';
    ELSE
        RAISE NOTICE 'Colonne validated_at existe déjà dans matches';
    END IF;
END $$;

-- ===================================
-- 3. TABLE TOURNOIS - Ajouter index mode
-- ===================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'tournois' AND indexname = 'idx_tournois_mode'
    ) THEN
        CREATE INDEX idx_tournois_mode ON tournois(mode);
        RAISE NOTICE 'Index idx_tournois_mode créé';
    ELSE
        RAISE NOTICE 'Index idx_tournois_mode existe déjà';
    END IF;
END $$;

-- ===================================
-- VALIDATION
-- ===================================
DO $$
DECLARE
    missing_cols TEXT := '';
BEGIN
    -- Vérifier joueurs.gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'joueurs' AND column_name = 'gender') THEN
        missing_cols := missing_cols || 'joueurs.gender, ';
    END IF;

    -- Vérifier matches.type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'type') THEN
        missing_cols := missing_cols || 'matches.type, ';
    END IF;

    -- Vérifier matches.manches_json
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'manches_json') THEN
        missing_cols := missing_cols || 'matches.manches_json, ';
    END IF;

    IF missing_cols != '' THEN
        RAISE EXCEPTION 'Migration échouée ! Colonnes manquantes: %', missing_cols;
    ELSE
        RAISE NOTICE '✅ Migration réussie ! Toutes les colonnes ont été ajoutées.';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

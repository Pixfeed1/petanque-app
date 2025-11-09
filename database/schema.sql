-- ===================================
-- SCHÉMA POSTGRESQL COMPLET
-- Application Pétanque Pro
-- ===================================

-- Suppression des tables existantes (attention en production!)
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS equipes CASCADE;
DROP TABLE IF EXISTS joueurs CASCADE;
DROP TABLE IF EXISTS tournois CASCADE;
DROP TABLE IF EXISTS organisations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===================================
-- TABLE USERS (Authentification)
-- ===================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- ===================================
-- TABLE ORGANISATIONS
-- ===================================
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_organisations_created_by ON organisations(created_by);

-- ===================================
-- TABLE USER_ROLES (Permissions)
-- ===================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);

-- ===================================
-- TABLE TOURNOIS
-- ===================================
CREATE TABLE tournois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL, -- 'tete_a_tete', 'doublette', 'triplette'
  mode VARCHAR(50) NOT NULL, -- 'choisi', 'melee_fixe', 'melee_tournante'
  status VARCHAR(50) DEFAULT 'preparation', -- 'preparation', 'en_cours', 'termine'
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tournois_org_id ON tournois(org_id);
CREATE INDEX idx_tournois_status ON tournois(status);
CREATE INDEX idx_tournois_mode ON tournois(mode);

-- ===================================
-- TABLE JOUEURS
-- ===================================
CREATE TABLE joueurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('H', 'F')), -- H = Homme, F = Femme
  email VARCHAR(255),
  phone VARCHAR(50),
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_joueurs_org_id ON joueurs(org_id);
CREATE INDEX idx_joueurs_name ON joueurs(name);
CREATE INDEX idx_joueurs_gender ON joueurs(gender);

-- ===================================
-- TABLE EQUIPES
-- ===================================
CREATE TABLE equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  joueur_ids UUID[] DEFAULT ARRAY[]::uuid[], -- Array d'UUIDs des joueurs
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipes_tournoi_id ON equipes(tournoi_id);

-- ===================================
-- TABLE MATCHES
-- ===================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournoi_id UUID NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
  tour INTEGER NOT NULL DEFAULT 1,
  terrain INTEGER,
  equipe_a_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
  equipe_b_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'a_jouer', -- 'a_jouer', 'en_cours', 'termine'
  type VARCHAR(50), -- 'poule', 'huitieme', 'quart', 'demi', 'finale', 'petite_finale'
  poule VARCHAR(10), -- 'A', 'B', 'C', etc. (pour matches de poule)
  winner_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
  manches_json JSONB DEFAULT '[]'::jsonb, -- Détails des manches jouées
  started_at TIMESTAMP, -- Quand le match a commencé
  ended_at TIMESTAMP, -- Quand le match s'est terminé
  validated_at TIMESTAMP, -- Quand le score a été validé
  proposed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Utilisateur qui a proposé le score (pour double validation)
  proposed_at TIMESTAMP, -- Date de proposition du score
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  played_at TIMESTAMP
);

CREATE INDEX idx_matches_tournoi_id ON matches(tournoi_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_type ON matches(type);
CREATE INDEX idx_matches_poule ON matches(poule);
CREATE INDEX idx_matches_equipe_a_id ON matches(equipe_a_id);
CREATE INDEX idx_matches_equipe_b_id ON matches(equipe_b_id);
CREATE INDEX idx_matches_proposed_by ON matches(proposed_by);

-- ===================================
-- TABLE PAYMENT_ATTEMPTS (Stripe)
-- ===================================
CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'eur',
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX idx_payment_attempts_stripe_session_id ON payment_attempts(stripe_session_id);

-- ===================================
-- FONCTIONS UTILITAIRES
-- ===================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournois_updated_at BEFORE UPDATE ON tournois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_joueurs_updated_at BEFORE UPDATE ON joueurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- DONNÉES DE TEST (optionnel)
-- ===================================

-- Vous pouvez ajouter des données de test ici si nécessaire
-- INSERT INTO users (email, password_hash, full_name) VALUES
-- ('test@example.com', 'hash_here', 'Test User');

-- ===================================
-- FIN DU SCHÉMA
-- ===================================

COMMENT ON TABLE users IS 'Utilisateurs de l''application avec authentification';
COMMENT ON TABLE organisations IS 'Clubs et organisations gérant des tournois';
COMMENT ON TABLE user_roles IS 'Rôles et permissions des utilisateurs dans les organisations';
COMMENT ON TABLE tournois IS 'Tournois de pétanque';
COMMENT ON TABLE joueurs IS 'Joueurs participants aux tournois';
COMMENT ON TABLE equipes IS 'Équipes formées pour les tournois';
COMMENT ON TABLE matches IS 'Matchs entre équipes dans les tournois';
COMMENT ON TABLE payment_attempts IS 'Tentatives de paiement Stripe pour les upgrades Premium';

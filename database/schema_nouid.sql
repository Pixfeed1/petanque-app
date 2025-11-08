-- ===================================
-- SCHÉMA POSTGRESQL SANS UUID
-- Application Pétanque Pro
-- Pour serveurs PostgreSQL sans pgcrypto/uuid-ossp
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
  id BIGSERIAL PRIMARY KEY,
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
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_organisations_created_by ON organisations(created_by);

-- ===================================
-- TABLE USER_ROLES
-- ===================================
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);

-- ===================================
-- TABLE TOURNOIS
-- ===================================
CREATE TABLE tournois (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  mode VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'preparation',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tournois_org_id ON tournois(org_id);
CREATE INDEX idx_tournois_status ON tournois(status);
CREATE INDEX idx_tournois_mode ON tournois(mode);

-- ===================================
-- TABLE JOUEURS
-- ===================================
CREATE TABLE joueurs (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('H', 'F')),
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
  id BIGSERIAL PRIMARY KEY,
  tournoi_id BIGINT NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  joueur_ids JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipes_tournoi_id ON equipes(tournoi_id);

-- ===================================
-- TABLE MATCHES
-- ===================================
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  tournoi_id BIGINT NOT NULL REFERENCES tournois(id) ON DELETE CASCADE,
  tour INTEGER NOT NULL DEFAULT 1,
  terrain INTEGER,
  equipe_a_id BIGINT REFERENCES equipes(id) ON DELETE SET NULL,
  equipe_b_id BIGINT REFERENCES equipes(id) ON DELETE SET NULL,
  score_a INTEGER DEFAULT 0,
  score_b INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'a_jouer',
  type VARCHAR(50),
  poule VARCHAR(10),
  winner_id BIGINT REFERENCES equipes(id) ON DELETE SET NULL,
  manches_json JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  validated_at TIMESTAMP,
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

-- ===================================
-- TABLE PAYMENT_ATTEMPTS
-- ===================================
CREATE TABLE payment_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'eur',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX idx_payment_attempts_stripe_session_id ON payment_attempts(stripe_session_id);

-- ===================================
-- TRIGGERS POUR updated_at
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tournois_updated_at BEFORE UPDATE ON tournois
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_joueurs_updated_at BEFORE UPDATE ON joueurs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

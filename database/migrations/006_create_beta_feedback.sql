-- ===================================
-- Migration 006: Mode Beta + Feedback utilisateurs
-- ===================================

-- Table de configuration globale de l'app
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insérer le paramètre beta_mode (désactivé par défaut)
INSERT INTO app_settings (key, value) VALUES
  ('beta_mode', '{"enabled": false, "message": "L''appli est toute nouvelle et on a besoin de vous ! Toutes les fonctionnalites sont gratuites en ce moment. Dites-nous ce qui marche bien, ce qui manque ou ce qu''on peut ameliorer."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Table de feedback utilisateurs
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'new',
  admin_reply TEXT,
  admin_replied_at TIMESTAMP,
  admin_replied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

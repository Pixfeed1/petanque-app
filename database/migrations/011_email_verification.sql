-- Migration 011 : vérification d'email (double opt-in à l'inscription)
-- Ajoute un jeton de vérification. Les comptes EXISTANTS sont « grandfathered »
-- (marqués vérifiés) pour ne bloquer/gêner personne rétroactivement — seule les
-- NOUVELLES inscriptions par mot de passe recevront un email d'activation.

ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Comptes existants considérés vérifiés (évite de gêner les utilisateurs actuels).
UPDATE users SET email_verified = true WHERE email_verified = false OR email_verified IS NULL;

COMMENT ON COLUMN users.verification_token IS 'Jeton d''activation d''email (NULL une fois vérifié).';

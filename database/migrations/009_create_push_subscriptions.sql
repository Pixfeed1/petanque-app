-- Migration 009 : abonnements aux notifications push
-- Stocke un abonnement par appareil/navigateur pour un utilisateur.
--   - platform 'web'     : Web Push (VAPID) — endpoint + clés p256dh/auth
--   - platform 'android' : notification native (FCM) — jeton fcm_token
-- Un utilisateur peut avoir plusieurs abonnements (plusieurs appareils).
-- NB : ids en BIGINT/SERIAL pour matcher le schéma de production (users.id BIGINT).

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL DEFAULT 'web',
  -- Web Push
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  -- FCM (Android natif)
  fcm_token TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un même endpoint Web Push / jeton FCM ne doit exister qu'une fois (upsert idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_push_endpoint ON push_subscriptions(endpoint) WHERE endpoint IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_push_fcm_token ON push_subscriptions(fcm_token) WHERE fcm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

COMMENT ON TABLE push_subscriptions IS 'Abonnements aux notifications push (Web Push VAPID + FCM natif).';

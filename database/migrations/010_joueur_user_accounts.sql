-- Migration 010 : comptes joueurs
-- Lie une fiche joueur (org-scopée) à un compte utilisateur (login), pour qu'un
-- joueur puisse se connecter, voir ses tournois/matchs et recevoir des notifications
-- (« c'est ton tour »).
--
-- Un utilisateur a AU PLUS une fiche par organisation (UNIQUE org_id+user_id).
-- Une fiche peut ne pas être liée (user_id NULL) : la gestion 100 % organisateur
-- (fiches sans compte) continue de fonctionner exactement comme avant.

ALTER TABLE joueurs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Un même utilisateur ne peut être lié qu'à une seule fiche par organisation.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_joueur_user_per_org
  ON joueurs(org_id, user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_joueurs_user_id ON joueurs(user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN joueurs.user_id IS 'Compte utilisateur lié à cette fiche joueur (NULL = fiche gérée par l''organisateur, sans login).';

-- Invitations : jeton envoyé/partagé à un joueur pour qu'il réclame sa fiche.
CREATE TABLE IF NOT EXISTS joueur_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joueur_id UUID NOT NULL REFERENCES joueurs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email VARCHAR(255),
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_joueur_invit_joueur ON joueur_invitations(joueur_id);
CREATE INDEX IF NOT EXISTS idx_joueur_invit_status ON joueur_invitations(status);
-- Une seule invitation en attente par fiche (on régénère si besoin).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_joueur_invit_pending
  ON joueur_invitations(joueur_id) WHERE status = 'pending';

COMMENT ON TABLE joueur_invitations IS 'Invitations pour lier une fiche joueur à un compte utilisateur.';

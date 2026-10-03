-- 012 — Type de match « exempt » (règle A+2, oct. 2026)
--
-- Avec un nombre impair d'équipes en mode « une partie = un match par équipe »
-- (mêlée tournante, N parties), l'équipe sans adversaire reçoit un match
-- d'exemption : equipe_b_id NULL, status 'termine', victoire fictive 13-7
-- (convention des concours). Ce type doit être accepté par la contrainte.

ALTER TABLE matches DROP CONSTRAINT IF EXISTS chk_matches_type;
ALTER TABLE matches ADD CONSTRAINT chk_matches_type
  CHECK (
    type IS NULL OR
    type IN (
      'poule', 'bye', 'exempt', 'elimination',
      'huitieme', 'quart', 'demi', 'finale', 'petite_finale'
    ) OR
    type LIKE 'de:%'
  ) NOT VALID;

-- Même liste dans la contrainte héritée du schéma de base (si présente).
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_type_check;
ALTER TABLE matches ADD CONSTRAINT matches_type_check
  CHECK (
    type IS NULL OR
    type IN (
      'poule', 'bye', 'exempt', 'elimination',
      'huitieme', 'quart', 'demi', 'finale', 'petite_finale'
    ) OR
    type LIKE 'de:%'
  ) NOT VALID;

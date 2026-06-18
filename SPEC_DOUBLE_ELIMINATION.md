# Double élimination — spec d'intégration pour Claude Code

> Branche `dev-petanque`. L'algorithme est **déjà écrit et testé** (28 tests verts, tsc 0).
> Ton travail = l'intégrer (API + persistance + UI). Tu ne réécris PAS l'algo.

## Décisions produit (déjà tranchées)
- **Finale unique** (pas de bracket reset). Le cœur de l'algo est identique ; le reset pourra
  s'ajouter plus tard.
- **3e place** = perdant de la finale du losers bracket (pas de petite finale séparée).

---

## Fichiers fournis (à intégrer tels quels)
1. `lib/services/_prototype/doubleElimination.ts` → **déplace-le** en
   `lib/services/doubleElimination.service.ts` (retire le dossier `_prototype`).
2. `lib/services/_prototype/__tests__/doubleElimination.test.ts` → déplace en
   `lib/services/__tests__/doubleElimination.service.test.ts` (corrige le chemin d'import).
3. Garde TOUS les tests : ils sont le filet de sécurité.

API publique du module :
- **`computeBracketState(nbTeams, équipesParSeed, résultats?)`** → **LA fonction maîtresse**.
  Recalcule l'état complet (équipes placées, byes propagés, statut de chaque match). Pure et
  déterministe. Étapes B et C l'appellent toutes les deux.
- `generateDoubleElimination(nbTeams)` → structure brute (slots + routage). Bas niveau.
- `toPersistenceRows(nbTeams)` → lignes `type`/`tour` (si besoin du squelette seul).
- `parseDeType(type)` → `"de:W1-0"` → `"W1-0"` (et `null` pour l'élim simple/poules).
- `seedOrder(bracketSize)` → ordre de seeding standard.

Le type `DEMatchState` renvoyé par `computeBracketState` :
`{ matchId, type, tour, bracket, round, equipeAId, equipeBId, winnerId, status, isBye }`
avec `status ∈ 'a_jouer' | 'en_attente' | 'termine'`. Les équipes sont génériques (string/bigint OK).

---

## Modèle de persistance (AUCUNE nouvelle colonne)
La table `matches` n'a ni colonne bracket ni routage. On encode l'identité du slot dans `type` :
- `matches.type = "de:W1-0"` (ou `de:L2-1`, `de:GF`) → identifie le slot **et** le mode.
- `matches.tour` = ordre de jeu/affichage (fourni par `toPersistenceRows`).
- Le routage se **re-dérive** à la complétion via `generateDoubleElimination(nbTeams)` — déterministe.

Ainsi l'élim simple existante n'est pas touchée (ses matchs n'ont pas de `type` commençant par `de:`).

---

## ÉTAPE B — Génération du bracket (API)
Là où l'élim simple est générée aujourd'hui, ajoute une branche `eliminationFormat === 'double'` :

1. Construis `teamIdsBySeed` = les IDs d'équipes **dans l'ordre de seeding** (seed 1 = mieux classé).
   Garde-fou : si `nbTeams < 3`, retombe sur l'élim simple (la double élim n'a pas de sens).
2. `const state = computeBracketState(nbTeams, teamIdsBySeed)` (results vide = état initial).
3. Pour chaque `m` de `state`, INSERT un `matches` :
   `type = m.type`, `tour = m.tour`, `equipe_a_id = m.equipeAId`, `equipe_b_id = m.equipeBId`,
   `status = m.status`, et si `m.isBye` → `winner_id = m.winnerId` (bye déjà résolu par le réducteur).

✅ **Les byes sont gérés par `computeBracketState`** — tu n'écris aucune logique de bye toi-même.
Un effectif non-puissance-de-2 sort déjà avec les bons matchs `a_jouer` / `en_attente` / `termine`.

---

## ÉTAPE C — Avancement à la complétion
Aujourd'hui seul le gagnant avance. Avec le réducteur, tu n'as **rien à router à la main** : tu
ajoutes le résultat et tu recalcules tout l'état.

À la validation d'un match dont `parseDeType(match.type)` est non-null (= match double élim) :

1. Construis `results: Map<matchId, winnerEquipeId>` à partir des matchs **déjà terminés** du
   tournoi : `results.set(parseDeType(row.type), row.winner_id)` pour chaque match `de:*` terminé
   (le match qu'on vient de valider inclus).
2. `const state = computeBracketState(nbTeams, teamIdsBySeed, results)`.
3. **Upsert le différentiel** : pour chaque `m` de `state`, mets à jour la ligne `matches` de même
   `type` si `equipe_a_id`, `equipe_b_id`, `status` ou `winner_id` ont changé. (Les tournois sont
   petits : recalculer tout l'état à chaque complétion est trivial et increvable.)
4. Le champion = `state.find(m => m.matchId === 'GF').winnerId` quand la GF est `termine`.

**3e place** (podium) = le **perdant de la finale LB** : le match `L*` de plus grand `round` dont
le `bracket === 'L'` ; son perdant est 3e. (Tu peux le déduire de `state` + `results`.)

Cette approche (réducteur = source de vérité unique) élimine la classe de bugs de routage manuel
qui a déjà frappé le bracket simple (#1/#3).

---

## ÉTAPE D — UI (page bracket)
`app/tournoi/[id]/bracket/page.tsx` n'affiche qu'un seul arbre. Pour la double élim :
- Détecte le mode (présence de matchs `type LIKE 'de:%'`, ou `eliminationFormat`).
- Affiche **deux sections** : « Tableau principal » (matchs `de:W*`) et « Repêchages » (`de:L*`),
  groupées par `round`, plus la **grande finale** (`de:GF`).
- Le schéma de référence (8 équipes) est dans la conversation : WB en haut, LB en bas, GF à droite.
- Réutilise les composants de carte de match existants ; ne réinvente pas le rendu d'un match.

---

## Acceptation
- `npx vitest run` → tout vert, **y compris** les 28 tests double élim déplacés.
- `npm run build` → exit 0 ; `npx tsc --noEmit` → 0 erreur.
- Test manuel : créer un tournoi Club, cocher « double élimination », vérifier qu'un perdant
  réapparaît dans les repêchages et qu'il faut **2 défaites** pour être éliminé.
- Commits séparés par étape (B, C, D) sur `dev-petanque`, messages clairs.
- `git log --oneline -6` à la fin.

## Hors périmètre (plus tard)
- Bracket reset (double grande finale).
- Rematch parfait : l'algo limite déjà les rematchs (≤1, la finale LB, structurellement inévitable).

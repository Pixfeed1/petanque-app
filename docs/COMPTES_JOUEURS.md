# Comptes joueurs

Permet à un joueur d'avoir un **compte** (login) lié à sa **fiche** dans un club,
pour voir ses tournois, son prochain match, et recevoir une notification
« c'est à toi de jouer ». Rétro-compatible : une fiche sans compte fonctionne
exactement comme avant (gestion 100 % organisateur).

## Modèle
- `joueurs.user_id` (BIGINT, nullable) → `users(id)`. Une fiche liée à un compte.
- Contrainte : **une fiche par organisation et par utilisateur** (index unique partiel).
- `joueur_invitations` : jetons d'invitation (pending/accepted/revoked, expiration 30 j).
- Migration : `010_joueur_user_accounts.sql`.

## Trois voies de liaison (toutes actives)
1. **Lien / QR d'invitation** — sur la fiche joueur (page organisateur), bouton
   « Générer un lien d'invitation » → lien + QR (`components/InvitePlayerCard`).
   Le joueur ouvre `/rejoindre/[token]` → se connecte ou crée un compte joueur → fiche liée.
2. **Auto par email** — si l'organisateur met l'email du joueur sur sa fiche, le joueur
   qui s'inscrit/se connecte avec ce même email est lié automatiquement
   (`autoLinkByEmail`, branché sur login / signup / signup-player).
3. **Code club** — *(à venir : prochaine sous-étape)* un code unique par organisation.

## Parcours joueur
- `/rejoindre/[token]` : aperçu (nom + club), puis liaison. Un nouveau joueur crée un
  **compte sans club** (`/api/auth/signup-player`) — il ne devient pas organisateur.
- `/moi` : espace joueur — fiches liées, tournois, prochain match (bouton direct vers le match).
- Un compte sans organisation est automatiquement redirigé vers `/moi` (pas vers le dashboard).

## « C'est à toi de jouer »
Quand une nouvelle ronde/manche est générée (`new-rotation`, `engine-advance`), les
joueurs **liés** des équipes concernées reçoivent un push (`lib/push/notifyPlayers.ts`)
avec l'adversaire, le terrain et un lien direct vers le match. Best-effort, jamais bloquant.

## Sécurité / garde-fous
- Génération d'invitation réservée aux membres de l'organisation du joueur.
- `acceptInvitation` est transactionnel (`FOR UPDATE`) : pas de double liaison.
- Erreurs claires : `LINKED_TO_OTHER`, `ALREADY_HAS_PROFILE`, `INVALID_INVITATION`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `database/migrations/010_joueur_user_accounts.sql` | Schéma (lien + invitations) |
| `lib/services/playerAccounts.ts` | Liaison, invitation, auto-email (+ 12 tests) |
| `lib/services/playerView.ts` | Vue joueur (tournois + prochain match) |
| `lib/push/notifyPlayers.ts` | Push « c'est à toi de jouer » |
| `app/api/joueurs/[id]/invite` | Génère une invitation |
| `app/api/invitations/[token]` | Aperçu + acceptation |
| `app/api/auth/signup-player` | Inscription joueur sans club |
| `app/api/me/player` | Espace joueur (données) |
| `app/rejoindre/[token]`, `app/moi` | Pages joueur |
| `components/InvitePlayerCard` | Lien + QR côté organisateur |

## Reste à faire (sous-étapes suivantes du chantier)
- **Code club** (3ᵉ voie de liaison).
- Notifier aussi au **démarrage** du tournoi (1er match), option côté organisateur.
- Espace joueur : historique/classement personnel.

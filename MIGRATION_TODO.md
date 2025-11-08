# 🔧 Migration PostgreSQL - Travail Restant

## ✅ Ce qui est déjà fait

### Backend (100% terminé)
- ✅ Schéma PostgreSQL complet
- ✅ Connexion DB (lib/db.ts)
- ✅ Authentification JWT (lib/auth.ts)
- ✅ Middlewares (lib/middleware.ts)
- ✅ APIs REST complètes :
  - Auth (login, signup, logout, me)
  - Organisations
  - Tournois + tournois/[id]
  - Joueurs
  - Équipes + équipes/[id]
  - Matches + matches/[id]

### Frontend (70% terminé)
- ✅ AuthProvider (app/providers/AuthProvider.tsx)
- ✅ Page login (app/login/page.tsx)
- ✅ Dashboard (app/dashboard.tsx)
- ✅ Création tournoi (app/tournoi/nouveau/page.tsx)

## ⚠️ Fichiers restants à migrer

### 1. Page détail tournoi - `app/tournoi/[id]/page.tsx` (EN COURS)

**Problème** : Utilise des jointures complexes Supabase `equipes_joueurs(joueur:joueurs(*))`

**Solution** :
```typescript
// AVANT (Supabase)
const { data } = await supabase
  .from('equipes')
  .select('*, equipes_joueurs(joueur:joueurs(*))')

// APRÈS (PostgreSQL)
const response = await fetch(`/api/equipes?tournoi_id=${tournoiId}`)
const equipes = await response.json()
// L'API /api/equipes/[id] enrichit automatiquement avec les joueurs
```

**Appels à remplacer** :
- Ligne 196 : Charger tournoi → `fetch('/api/tournois/${id}')`
- Ligne 208 : Charger équipes → `fetch('/api/equipes?tournoi_id=...')`
- Ligne 224 : Charger matches → `fetch('/api/matches?tournoi_id=...')`
- Ligne 249 : Vérifier rôle utilisateur (enlever, géré par backend)
- Ligne 270 : Stats joueurs (adapter pour nouveau schéma)
- Ligne 320, 381, 396 : Updates diverses

### 2. Page bracket - `app/tournoi/[id]/bracket/page.tsx`

**Appels Supabase à remplacer** :
- Charger tournoi
- Charger matches avec équipes
- Mettre à jour matches

### 3. Page podium - `app/tournoi/[id]/podium/page.tsx`

**Appels Supabase à remplacer** :
- Charger tournoi
- Charger équipes avec classement
- Charger joueurs si mêlée

### 4. Page export - `app/tournoi/[id]/export/page.tsx`

**Appels Supabase à remplacer** :
- Charger toutes les données du tournoi
- Exports PDF/Excel (pas de changement dans la logique)

### 5. Page match - `app/match/[id]/page.tsx`

**Appels Supabase à remplacer** :
- Charger match
- Mettre à jour scores
- Marquer match terminé

### 6. Page joueur - `app/joueurs/[id]/page.tsx`

**Appels Supabase à remplacer** :
- Charger joueur
- Charger stats/historique
- Mettre à jour joueur

### 7. APIs Stripe

**Fichiers** :
- `app/api/create-checkout-session/route.ts`
- `app/api/webhook-stripe/route.ts`

**À faire** : Remplacer `supabaseAdmin` par des appels directs à la DB via `query()`

### 8. Fichier callback OAuth - `app/auth/callback/page.tsx`

**Action** : Supprimer (OAuth Google/Facebook désactivé pour l'instant)

### 9. Fichiers dupliqués/inutiles

**À supprimer** :
- `app/tournoi/nouveau/page_fixed.tsx` (doublon)
- `lib/supabase.ts` (plus utilisé)

## 📝 Pattern de migration standard

Pour chaque fichier, suivre ce pattern :

### Étape 1 : Retirer imports Supabase
```typescript
// SUPPRIMER
import { supabase } from '@/lib/supabase'
```

### Étape 2 : Utiliser useAuth au lieu de supabase.auth
```typescript
// AVANT
const { data: { user } } = await supabase.auth.getUser()

// APRÈS
const { user, organization } = useAuth()
```

### Étape 3 : Remplacer les requêtes SELECT
```typescript
// AVANT
const { data, error } = await supabase
  .from('tournois')
  .select('*')
  .eq('id', id)
  .single()

// APRÈS
const response = await fetch(`/api/tournois/${id}`, {
  credentials: 'include'
})
const data = await response.json()
```

### Étape 4 : Remplacer les INSERT
```typescript
// AVANT
const { data, error } = await supabase
  .from('tournois')
  .insert({ name, org_id })
  .select()
  .single()

// APRÈS
const response = await fetch('/api/tournois', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name, org_id })
})
const data = await response.json()
```

### Étape 5 : Remplacer les UPDATE
```typescript
// AVANT
await supabase
  .from('tournois')
  .update({ status: 'en_cours' })
  .eq('id', id)

// APRÈS
await fetch(`/api/tournois/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ status: 'en_cours' })
})
```

### Étape 6 : Remplacer les DELETE
```typescript
// AVANT
await supabase
  .from('tournois')
  .delete()
  .eq('id', id)

// APRÈS
await fetch(`/api/tournois/${id}`, {
  method: 'DELETE',
  credentials: 'include'
})
```

## 🔍 Commandes utiles pour la migration

### Trouver les fichiers utilisant encore Supabase
```bash
grep -r "from '@/lib/supabase'" app/
```

### Trouver les appels Supabase dans un fichier
```bash
grep -n "supabase\." app/fichier.tsx
```

### Vérifier qu'un fichier est migré
```bash
grep -i "supabase" app/fichier.tsx  # Doit retourner vide
```

## 🎯 Priorité de migration

1. **URGENT** : `app/tournoi/[id]/page.tsx` (page principale)
2. **IMPORTANT** : `app/match/[id]/page.tsx` (saisie scores)
3. **MOYEN** : Bracket, Podium, Export
4. **FAIBLE** : Page joueur, Stripe

## ⚡ Estimation temps restant

- Page tournoi detail : **30-40 min** (complexe)
- Page match : **10-15 min** (simple)
- Pages bracket/podium/export : **20-30 min** chacune
- Page joueur : **10 min**
- APIs Stripe : **15 min**
- Nettoyage : **5 min**

**TOTAL : ~2-3 heures de travail**

## 🚨 Points d'attention

### Schéma différent pour équipes
Notre nouveau schéma :
```sql
CREATE TABLE equipes (
  id UUID PRIMARY KEY,
  tournoi_id UUID REFERENCES tournois(id),
  name VARCHAR(255),
  joueur_ids JSONB, -- Array d'UUIDs au lieu d'une table de liaison
  stats JSONB
)
```

Ancien schéma Supabase avait :
```sql
CREATE TABLE equipes_joueurs (
  equipe_id UUID REFERENCES equipes(id),
  joueur_id UUID REFERENCES joueurs(id),
  role VARCHAR(50)
)
```

**Impact** : Les jointures complexes ne fonctionnent plus. On charge les équipes puis on enrichit avec les joueurs via l'API.

### Sessions et authentification
- Tout passe maintenant par **cookies HTTP-only**
- Plus de `session storage` côté client
- Utiliser `credentials: 'include'` dans TOUS les fetch

### Gestion des erreurs
```typescript
const response = await fetch('/api/...')
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.error || 'Erreur')
}
const data = await response.json()
```

## 📞 Besoin d'aide ?

Si tu bloques sur un fichier, voici la démarche :

1. Identifie tous les appels `supabase` avec `grep -n "supabase\." fichier.tsx`
2. Pour chaque appel, trouve l'API équivalente dans `/app/api/`
3. Remplace par un `fetch()` avec la bonne méthode HTTP
4. Teste que ça fonctionne
5. Commit régulièrement !

---

**Bon courage ! Tu y es presque, 70% du travail est fait ! 🚀**

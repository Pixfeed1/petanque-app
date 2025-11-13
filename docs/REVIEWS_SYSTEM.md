# 📝 Système d'avis - Documentation

## Vue d'ensemble

Le système d'avis de Pétanque Pro permet de collecter, modérer et afficher les avis utilisateurs provenant de multiples sources :

- ✅ **Avis internes** (formulaire web)
- ✅ **Google Play Store** (synchronisation automatique - dormant)
- ✅ **Apple App Store** (synchronisation automatique - dormant)

---

## 🏗️ Architecture

### Base de données

**Table `reviews`** :
```sql
- id: identifiant unique
- user_id: référence vers users (NULL pour avis externes)
- rating: note de 1 à 5 étoiles
- content: texte de l'avis
- name: nom affiché (ex: "Jean-Pierre M.")
- role: rôle optionnel (ex: "Président club de Marseille")
- source: 'web', 'google_play' ou 'app_store'
- approved: booléen (modération)
- external_id: ID externe pour éviter doublons stores
- created_at, updated_at, approved_at, approved_by
```

### Fichiers créés

```
database/migrations/
  └── 005_create_reviews_table.sql

app/api/reviews/
  ├── route.ts (GET - récupérer avis)
  ├── submit/route.ts (POST - soumettre avis)
  ├── moderate/route.ts (GET/POST - modération admin)
  ├── sync-google-play/route.ts (GET - sync Google Play)
  └── sync-app-store/route.ts (GET - sync App Store)

app/admin/reviews/
  └── page.tsx (Panel admin modération)

app/avis/
  └── page.tsx (Page publique tous les avis)

app/components/
  └── ReviewPrompt.tsx (Popup demande d'avis)
```

---

## 🚀 Installation & Configuration

### 1. Appliquer la migration

```bash
# Sur votre serveur de production
cd /path/to/petanque-app
psql -h localhost -d petanque -U your_user -f database/migrations/005_create_reviews_table.sql
```

### 2. Configurer les variables d'environnement

Éditez votre fichier `.env` (ou `.env.local`) :

```bash
# Emails des admins (séparés par virgules)
ADMIN_EMAILS=votre-email@example.com,admin@petanquepro.fr

# Secret pour synchronisation stores
SYNC_SECRET=votre_secret_tres_securise_ici

# Google Play (à remplir plus tard)
GOOGLE_PLAY_APP_ID=
GOOGLE_PLAY_API_KEY=

# App Store (à remplir plus tard)
APP_STORE_APP_ID=
APP_STORE_TOKEN=
```

**Génération du SYNC_SECRET :**
```bash
openssl rand -base64 32
```

### 3. Rebuild & Redémarrer

```bash
npm run build
npm start
# ou utilisez votre script de déploiement
./deploy.sh
```

---

## 📖 Utilisation

### Pour les utilisateurs

**Soumettre un avis :**
- Après 3 tournois créés, une popup apparaît automatiquement
- L'utilisateur peut aussi soumettre un avis depuis une page dédiée (à créer si besoin)

**Consulter les avis :**
- Page d'accueil : 3 meilleurs avis + note moyenne
- `/avis` : tous les avis avec filtres par note

### Pour les administrateurs

**Accéder au panel de modération :**
1. Connectez-vous avec un compte admin (email dans `ADMIN_EMAILS`)
2. Allez sur `/admin/reviews`

**Modérer les avis :**
- **Approuver** : l'avis devient visible publiquement
- **Refuser** : l'avis est supprimé définitivement

**Statistiques :**
- En attente : avis non modérés
- Approuvés : avis visibles publiquement
- Total : tous les avis

---

## 🔄 Synchronisation avec les Stores

### Quand l'app sera sur Google Play

1. **Obtenir les identifiants :**
   - Allez sur [Google Play Console](https://play.google.com/console)
   - Créez une clé API dans "API access"
   - Récupérez votre `packageName` (ex: `com.petanquepro.app`)

2. **Configurer :**
   ```bash
   GOOGLE_PLAY_APP_ID=com.petanquepro.app
   GOOGLE_PLAY_API_KEY=votre_cle_api_ici
   ```

3. **Tester la synchronisation :**
   ```bash
   curl "https://petanquepro.fr/api/reviews/sync-google-play?secret=VOTRE_SYNC_SECRET"
   ```

4. **Automatiser (cron) :**
   ```bash
   # Ajouter au crontab
   0 2 * * * curl -s "https://petanquepro.fr/api/reviews/sync-google-play?secret=VOTRE_SECRET" >> /var/log/reviews-sync.log 2>&1
   ```

### Quand l'app sera sur App Store

1. **Obtenir les identifiants :**
   - Allez sur [App Store Connect](https://appstoreconnect.apple.com)
   - Créez un token API dans "Users and Access" > "Keys"
   - Récupérez votre App ID

2. **Configurer :**
   ```bash
   APP_STORE_APP_ID=123456789
   APP_STORE_TOKEN=votre_token_ici
   ```

3. **Tester & Automatiser :**
   - Même processus que Google Play

---

## 📊 API Endpoints

### Public

**GET `/api/reviews`**
- Paramètres : `approved`, `limit`, `offset`, `rating`, `source`, `order_by`, `order_dir`
- Retourne : liste d'avis + stats

**POST `/api/reviews/submit`**
- Body : `{ rating, content, name, role }`
- Authentification requise
- Retourne : succès + message de modération

### Admin (authentification admin requise)

**GET `/api/reviews/moderate`**
- Paramètres : `status` (`pending`, `approved`, `all`)
- Retourne : avis + statistiques

**POST `/api/reviews/moderate`**
- Body : `{ review_id, action }` (`approve` ou `reject`)
- Retourne : succès

### Synchronisation (secret requis)

**GET `/api/reviews/sync-google-play?secret=XXX`**
- Synchronise les avis depuis Google Play

**GET `/api/reviews/sync-app-store?secret=XXX`**
- Synchronise les avis depuis App Store

---

## 🎨 Personnalisation

### Modifier le seuil de popup

Par défaut, la popup apparaît après 3 tournois. Pour changer :

Éditez `app/components/ReviewPrompt.tsx` et ajustez la logique dans le dashboard où vous l'utilisez.

### Modifier les avis hardcodés

Éditez `app/page.tsx` :
```javascript
const testimonials_hardcoded = [
  {
    name: 'Votre Nom',
    role: 'Votre Rôle',
    content: 'Votre commentaire',
    rating: 5
  }
  // ...
]
```

### Auto-approuver certains avis

Par défaut :
- Avis web : `approved = false` (modération requise)
- Avis stores : `approved = true` (auto-approuvés)

Pour changer, éditez les fichiers API correspondants.

---

## ⚠️ Notes importantes

### Sécurité

- ✅ Modération obligatoire pour avis web (anti-spam)
- ✅ Un utilisateur = un seul avis
- ✅ Validation longueur min/max
- ✅ Endpoints admin protégés par email

### Légal

- ✅ **Autorisé** : modération anti-spam/insultes
- ✅ **Autorisé** : sélection éditoriale (meilleurs avis homepage)
- ❌ **Interdit** : supprimer TOUS les avis négatifs
- ❌ **Interdit** : publier de faux avis

### Performance

- Pagination automatique (12 avis par page sur `/avis`)
- Index SQL sur colonnes fréquentes
- Cache possible avec Redis (à implémenter si besoin)

---

## 🐛 Dépannage

### "Accès refusé - Vous n'êtes pas administrateur"

Vérifiez que votre email est bien dans `ADMIN_EMAILS` dans `.env`.

### Les avis n'apparaissent pas

1. Vérifiez que la migration SQL est appliquée
2. Vérifiez que les avis sont approuvés (via `/admin/reviews`)
3. Vérifiez la console navigateur pour erreurs API

### Synchronisation stores ne fonctionne pas

1. Vérifiez que `GOOGLE_PLAY_APP_ID` et `GOOGLE_PLAY_API_KEY` sont remplis
2. Vérifiez les logs serveur : `tail -f app.log`
3. Testez manuellement : `curl https://petanquepro.fr/api/reviews/sync-google-play?secret=XXX`

---

## 📞 Support

Pour toute question ou problème, contactez le développeur ou consultez la documentation technique dans le code source.

---

**Version :** 1.0
**Date :** 2025-11-13
**Auteur :** Claude (Anthropic)

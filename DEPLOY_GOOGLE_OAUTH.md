# 🚀 Déploiement Google OAuth sur le serveur de production

## ✅ Configuration terminée

Votre Google OAuth est maintenant configuré pour **petanquepro.fr**

### 📋 Récapitulatif

- **Domaine** : petanquepro.fr
- **Client ID** : Configuré dans Google Cloud Console
- **URL de redirection** : https://petanquepro.fr/api/auth/oauth/google/callback
- **Date de création** : 6 novembre 2025

⚠️ **IMPORTANT** : Vos clés OAuth sont stockées de manière sécurisée. Ne les partagez jamais publiquement !

---

## 📝 Étapes de déploiement sur le serveur

### 1. Connectez-vous à votre serveur

```bash
ssh jurojinn@serveur
cd petanquepro.fr  # ou le nom de votre dossier projet
```

### 2. Récupérez les derniers changements

```bash
git pull origin claude/fix-oauth-pages-011CUjL1zCjiWGDBpgh5pLsZ
```

### 3. Créez le fichier .env.local sur le serveur

```bash
nano .env.local
```

**Copiez-collez ce contenu** (remplacez les valeurs `your_*` par vos vraies valeurs) :

```bash
# ===================================
# CONFIGURATION POSTGRESQL
# ===================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=petanque
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password_here

# ===================================
# AUTHENTIFICATION JWT
# ===================================
# Générez avec: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# ===================================
# APPLICATION - PRODUCTION
# ===================================
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
NODE_ENV=production

# ===================================
# OAUTH - GOOGLE - PRODUCTION
# ===================================
# ⚠️ Remplacez par vos vraies clés depuis Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_from_google_cloud_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_google_cloud_console
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

# ===================================
# OAUTH - FACEBOOK (optionnel)
# ===================================
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/facebook/callback
```

**Sauvegardez** : `Ctrl+O` puis `Entrée`, puis `Ctrl+X`

### 4. Vérifiez que le fichier existe

```bash
ls -la .env.local
cat .env.local  # Vérifiez le contenu
```

### 5. Générez un JWT_SECRET sécurisé (si pas déjà fait)

```bash
openssl rand -base64 32
```

Copiez le résultat et remplacez `your_jwt_secret_key_change_this_in_production` dans `.env.local`

### 6. Installez les dépendances (si besoin)

```bash
npm install
```

### 7. Rebuild l'application

```bash
npm run build
```

### 8. Redémarrez l'application avec PM2

```bash
./node_modules/.bin/pm2 restart ecosystem.config.js
# ou
./node_modules/.bin/pm2 restart all
```

### 9. Vérifiez les logs

```bash
./node_modules/.bin/pm2 logs
```

---

## 🧪 Tester la connexion Google

1. Allez sur : **https://petanquepro.fr/login**
2. Cliquez sur le bouton **"Continuer avec Google"**
3. Vous devriez être redirigé vers Google
4. Connectez-vous avec votre compte Google
5. Vous devriez être redirigé vers le Dashboard

---

## ⚠️ Mode Test vs Production

### Actuellement : MODE TEST

Votre application est en **mode Test**, ce qui signifie que **seuls les utilisateurs que vous avez listés comme testeurs** peuvent se connecter.

### Passer en mode Production

Pour permettre à **tout le monde** de se connecter avec Google :

1. Allez sur : https://console.cloud.google.com/
2. Menu → **"APIs et services"** → **"Écran de consentement OAuth"**
3. Cliquez sur **"PUBLIER L'APPLICATION"**
4. Confirmez

⚠️ **Note** : Google peut demander une vérification si vous utilisez des scopes sensibles. Pour les scopes basiques (email, profile), c'est généralement automatique.

---

## 🔒 Sécurité

- ✅ Le fichier `.env.local` est dans `.gitignore` (il ne sera jamais commité)
- ✅ Ne partagez JAMAIS vos `GOOGLE_CLIENT_SECRET` ou `JWT_SECRET`
- ✅ Utilisez HTTPS en production (jamais HTTP)
- ✅ Les cookies sont en mode `httpOnly` et `secure`

---

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"

Vérifiez que l'URI de redirection dans Google Cloud Console correspond **exactement** à :
```
https://petanquepro.fr/api/auth/oauth/google/callback
```

### Erreur "access_denied"

Vous êtes probablement en mode Test et votre email n'est pas dans la liste des testeurs.

### L'application ne démarre pas

Vérifiez les logs :
```bash
./node_modules/.bin/pm2 logs
```

Vérifiez que toutes les variables d'environnement sont définies :
```bash
cat .env.local
```

---

## ✅ Checklist finale

- [ ] Fichier `.env.local` créé sur le serveur
- [ ] Toutes les variables remplies (surtout JWT_SECRET et POSTGRES_PASSWORD)
- [ ] Application rebuildée avec `npm run build`
- [ ] PM2 redémarré
- [ ] Test de connexion Google effectué
- [ ] (Optionnel) Application publiée en mode Production sur Google Cloud

---

Bon déploiement ! 🚀

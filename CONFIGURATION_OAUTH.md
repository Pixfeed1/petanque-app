# 🔐 CONFIGURATION OAUTH GOOGLE & FACEBOOK

Ce guide explique comment configurer l'authentification sociale avec Google et Facebook.

---

## 📋 VARIABLES D'ENVIRONNEMENT

Ajoutez ces variables à votre fichier `.env` ou dans la configuration cPanel :

```bash
# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
FACEBOOK_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/facebook/callback

# URL de l'application (déjà configurée normalement)
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
```

---

## 🔵 CONFIGURATION GOOGLE OAUTH

### Étape 1 : Créer un projet Google Cloud

1. Allez sur **[Google Cloud Console](https://console.cloud.google.com/)**
2. Cliquez sur **"Sélectionner un projet"** → **"Nouveau projet"**
3. Nom du projet : `Petanque Pro` (ou autre)
4. Cliquez sur **"Créer"**

---

### Étape 2 : Activer l'API Google+

1. Dans le menu de gauche : **APIs & Services** → **Enabled APIs & services**
2. Cliquez sur **"+ ENABLE APIS AND SERVICES"**
3. Recherchez **"Google+ API"** et activez-la
4. Recherchez également **"Google OAuth2 API"** et activez-la

---

### Étape 3 : Configurer l'écran de consentement OAuth

1. Menu de gauche : **APIs & Services** → **OAuth consent screen**
2. Sélectionnez **"External"** (pour que tout le monde puisse se connecter)
3. Cliquez sur **"Create"**

4. **Remplissez les informations** :
   - **App name** : `Pétanque Pro`
   - **User support email** : votre email
   - **App logo** : (optionnel)
   - **App domain** : `https://petanquepro.fr`
   - **Authorized domains** : `petanquepro.fr`
   - **Developer contact** : votre email
5. Cliquez sur **"Save and Continue"**

6. **Scopes** :
   - Cliquez sur **"Add or Remove Scopes"**
   - Sélectionnez : `email`, `profile`, `openid`
   - Cliquez sur **"Update"** puis **"Save and Continue"**

7. **Test users** (mode développement) :
   - Ajoutez votre email pour tester
   - Cliquez sur **"Save and Continue"**

---

### Étape 4 : Créer les identifiants OAuth

1. Menu de gauche : **APIs & Services** → **Credentials**
2. Cliquez sur **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type** : `Web application`
4. **Name** : `Petanque Pro Web`
5. **Authorized JavaScript origins** :
   ```
   https://petanquepro.fr
   ```
6. **Authorized redirect URIs** :
   ```
   https://petanquepro.fr/api/auth/oauth/google/callback
   ```
7. Cliquez sur **"Create"**

8. **Copiez les identifiants** :
   - **Client ID** → Variable `GOOGLE_CLIENT_ID`
   - **Client Secret** → Variable `GOOGLE_CLIENT_SECRET`

---

### Étape 5 : Passer en production (optionnel)

Par défaut, votre app est en mode test (max 100 utilisateurs).

Pour passer en production :
1. **OAuth consent screen** → Cliquez sur **"PUBLISH APP"**
2. Google demandera une vérification (peut prendre quelques jours)

---

## 🔷 CONFIGURATION FACEBOOK OAUTH

### Étape 1 : Créer une application Facebook

1. Allez sur **[Meta for Developers](https://developers.facebook.com/)**
2. Cliquez sur **"My Apps"** → **"Create App"**
3. Sélectionnez **"Consumer"** (pour les utilisateurs)
4. Cliquez sur **"Next"**

5. **Informations de l'app** :
   - **App name** : `Pétanque Pro`
   - **App contact email** : votre email
6. Cliquez sur **"Create app"**

---

### Étape 2 : Configurer Facebook Login

1. Dans le dashboard de votre app, cliquez sur **"Set Up"** à côté de **"Facebook Login"**
2. Sélectionnez **"Web"** comme plateforme
3. **Site URL** : `https://petanquepro.fr`
4. Cliquez sur **"Save"** puis **"Continue"**

---

### Étape 3 : Configurer les paramètres OAuth

1. Menu de gauche : **Facebook Login** → **Settings**
2. **Valid OAuth Redirect URIs** :
   ```
   https://petanquepro.fr/api/auth/oauth/facebook/callback
   ```
3. **Allowed Domains for the JavaScript SDK** :
   ```
   petanquepro.fr
   ```
4. Cliquez sur **"Save Changes"**

---

### Étape 4 : Récupérer les identifiants

1. Menu de gauche : **Settings** → **Basic**
2. **Copiez les identifiants** :
   - **App ID** → Variable `FACEBOOK_APP_ID`
   - **App Secret** → Cliquez sur **"Show"**, copiez → Variable `FACEBOOK_APP_SECRET`

---

### Étape 5 : Passer en production

Par défaut, votre app est en mode développement.

Pour passer en production :
1. Menu de gauche : **Settings** → **Basic**
2. En haut de la page, le mode est sur **"Development"**
3. Basculez sur **"Live"** (en haut à droite)
4. Facebook demandera des informations supplémentaires :
   - **Privacy Policy URL** : `https://petanquepro.fr/legal/rgpd`
   - **Terms of Service URL** : `https://petanquepro.fr/legal/cookies`
   - **App Icon** : (1024x1024 px minimum)
5. Cliquez sur **"Switch Mode"**

---

## ⚙️ CONFIGURATION SERVEUR (cPanel ou VPS)

### Ajout des variables d'environnement

#### **Option A : Via cPanel Node.js App**

1. Allez dans **Setup Node.js App**
2. Modifiez votre application
3. Ajoutez les 6 variables dans **Environment Variables** :
   ```
   GOOGLE_CLIENT_ID = ...
   GOOGLE_CLIENT_SECRET = ...
   GOOGLE_REDIRECT_URI = https://petanquepro.fr/api/auth/oauth/google/callback
   FACEBOOK_APP_ID = ...
   FACEBOOK_APP_SECRET = ...
   FACEBOOK_REDIRECT_URI = https://petanquepro.fr/api/auth/oauth/facebook/callback
   ```
4. Cliquez sur **"Restart"**

#### **Option B : Via .env (SSH)**

```bash
nano ~/petanquepro.fr/petanque-app/.env
```

Ajoutez :
```bash
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
FACEBOOK_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/facebook/callback
```

Sauvegardez (`Ctrl+X`, `Y`, `Entrée`) et redémarrez l'app :
```bash
pm2 restart petanque
```

---

## ✅ VÉRIFICATION

### Test de connexion Google

1. Allez sur `https://petanquepro.fr/login`
2. Cliquez sur le bouton **"Google"**
3. Vous devriez être redirigé vers Google
4. Acceptez les permissions
5. Vous devriez être connecté et redirigé vers `/dashboard`

### Test de connexion Facebook

1. Allez sur `https://petanquepro.fr/login`
2. Cliquez sur le bouton **"Facebook"**
3. Vous devriez être redirigé vers Facebook
4. Acceptez les permissions
5. Vous devriez être connecté et redirigé vers `/dashboard`

---

## 🐛 DÉPANNAGE

### Erreur `redirect_uri_mismatch` (Google)

**Problème** : L'URL de redirection ne correspond pas.

**Solution** :
1. Vérifiez que `GOOGLE_REDIRECT_URI` dans `.env` est exactement `https://petanquepro.fr/api/auth/oauth/google/callback`
2. Vérifiez dans Google Cloud Console que l'URI est bien configurée (sans slash à la fin)
3. Redémarrez l'app

### Erreur `URL Blocked: This redirect failed` (Facebook)

**Problème** : L'URL de redirection n'est pas autorisée.

**Solution** :
1. Vérifiez que `FACEBOOK_REDIRECT_URI` dans `.env` est exactement `https://petanquepro.fr/api/auth/oauth/facebook/callback`
2. Dans Facebook Developers, vérifiez que l'URL est dans **Valid OAuth Redirect URIs**
3. Redémarrez l'app

### Erreur `email_required` (Facebook)

**Problème** : L'utilisateur n'a pas partagé son email.

**Solution** :
- L'email est obligatoire pour créer un compte
- L'utilisateur doit accepter de partager son email lors de la connexion Facebook

### L'app est en mode test

**Problème** : Seuls les testeurs ajoutés peuvent se connecter.

**Solution** :
- **Google** : Publiez l'app dans OAuth consent screen
- **Facebook** : Passez l'app en mode "Live" dans Settings

---

## 🔒 SÉCURITÉ

### Bonnes pratiques

1. **Ne JAMAIS commiter** les secrets dans Git
2. **Utilisez HTTPS** en production (obligatoire pour OAuth)
3. **Vérifiez les emails** retournés par les providers
4. **Limitez les scopes** aux permissions minimales nécessaires
5. **Rotation des secrets** : changez-les régulièrement

### Scopes demandés

- **Google** : `openid`, `email`, `profile`
- **Facebook** : `email`, `public_profile`

Ces scopes sont suffisants pour créer un compte et connecter l'utilisateur.

---

## 📚 RESSOURCES

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Spec](https://oauth.net/2/)

---

## 📝 NOTES

- Les comptes créés via OAuth n'ont **pas de mot de passe**
- Les utilisateurs ne peuvent se connecter que via le provider utilisé initialement
- Les photos de profil sont stockées dans le champ `metadata.picture`
- Les ID des providers sont stockés dans `metadata.google_id` ou `metadata.facebook_id`

---

**Créé le** : 2025-11-02
**Auteur** : Claude Code
**Version** : 1.0

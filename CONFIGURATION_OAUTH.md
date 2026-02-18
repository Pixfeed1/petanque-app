# CONFIGURATION OAUTH GOOGLE & APPLE

Ce guide explique comment configurer l'authentification sociale avec Google et Apple Sign In.

---

## VARIABLES D'ENVIRONNEMENT

Ajoutez ces variables a votre fichier `.env` ou dans la configuration cPanel :

```bash
# Google OAuth
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

# Apple Sign In
APPLE_CLIENT_ID=fr.petanquepro.auth
APPLE_TEAM_ID=votre_team_id
APPLE_KEY_ID=votre_key_id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/apple/callback

# URL de l'application
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
```

---

## CONFIGURATION GOOGLE OAUTH

### Etape 1 : Creer un projet Google Cloud

1. Allez sur **[Google Cloud Console](https://console.cloud.google.com/)**
2. Cliquez sur **"Selectionner un projet"** -> **"Nouveau projet"**
3. Nom du projet : `Petanque Pro` (ou autre)
4. Cliquez sur **"Creer"**

---

### Etape 2 : Activer l'API Google+

1. Dans le menu de gauche : **APIs & Services** -> **Enabled APIs & services**
2. Cliquez sur **"+ ENABLE APIS AND SERVICES"**
3. Recherchez **"Google+ API"** et activez-la
4. Recherchez egalement **"Google OAuth2 API"** et activez-la

---

### Etape 3 : Configurer l'ecran de consentement OAuth

1. Menu de gauche : **APIs & Services** -> **OAuth consent screen**
2. Selectionnez **"External"** (pour que tout le monde puisse se connecter)
3. Cliquez sur **"Create"**

4. **Remplissez les informations** :
   - **App name** : `Petanque Pro`
   - **User support email** : votre email
   - **App logo** : (optionnel)
   - **App domain** : `https://petanquepro.fr`
   - **Authorized domains** : `petanquepro.fr`
   - **Developer contact** : votre email
5. Cliquez sur **"Save and Continue"**

6. **Scopes** :
   - Cliquez sur **"Add or Remove Scopes"**
   - Selectionnez : `email`, `profile`, `openid`
   - Cliquez sur **"Update"** puis **"Save and Continue"**

7. **Test users** (mode developpement) :
   - Ajoutez votre email pour tester
   - Cliquez sur **"Save and Continue"**

---

### Etape 4 : Creer les identifiants OAuth

1. Menu de gauche : **APIs & Services** -> **Credentials**
2. Cliquez sur **"+ CREATE CREDENTIALS"** -> **"OAuth client ID"**
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
   - **Client ID** -> Variable `GOOGLE_CLIENT_ID`
   - **Client Secret** -> Variable `GOOGLE_CLIENT_SECRET`

---

### Etape 5 : Passer en production (optionnel)

Par defaut, votre app est en mode test (max 100 utilisateurs).

Pour passer en production :
1. **OAuth consent screen** -> Cliquez sur **"PUBLISH APP"**
2. Google demandera une verification (peut prendre quelques jours)

---

## CONFIGURATION APPLE SIGN IN

### Etape 1 : Compte Apple Developer

1. Tu dois avoir un **compte Apple Developer** (99 EUR/an) sur **[developer.apple.com](https://developer.apple.com)**
2. Connecte-toi et va dans **Certificates, Identifiers & Profiles**

---

### Etape 2 : Creer un App ID

1. Va dans **Identifiers** -> clic sur le **+**
2. Selectionne **App IDs** -> **Continue**
3. Selectionne **App** -> **Continue**
4. Remplis :
   - **Description** : `Petanque Pro`
   - **Bundle ID** : `fr.petanquepro.app` (Explicit)
5. Dans les **Capabilities**, coche **Sign In with Apple**
6. Clic sur **Continue** -> **Register**

---

### Etape 3 : Creer un Service ID (c'est ton Client ID)

1. Va dans **Identifiers** -> clic sur le **+**
2. Selectionne **Services IDs** -> **Continue**
3. Remplis :
   - **Description** : `Petanque Pro Web`
   - **Identifier** : `fr.petanquepro.auth`  <-- C'EST TON `APPLE_CLIENT_ID`
4. Clic sur **Continue** -> **Register**

5. **Retourne sur ce Service ID** et clic dessus
6. Coche **Sign In with Apple** -> clic sur **Configure**
7. Dans la config :
   - **Primary App ID** : selectionne ton App ID (`fr.petanquepro.app`)
   - **Domains and Subdomains** : `petanquepro.fr`
   - **Return URLs** : `https://petanquepro.fr/api/auth/oauth/apple/callback`
8. Clic sur **Save** -> **Continue** -> **Save**

---

### Etape 4 : Creer une Key (cle privee)

1. Va dans **Keys** -> clic sur le **+**
2. Remplis :
   - **Key Name** : `Petanque Pro Sign In`
3. Coche **Sign In with Apple** -> clic sur **Configure**
4. Selectionne ton **Primary App ID** (`fr.petanquepro.app`)
5. Clic sur **Save** -> **Continue** -> **Register**

6. **IMPORTANT** : Telecharge le fichier `.p8` (tu ne pourras le telecharger qu'UNE SEULE FOIS)
7. Note le **Key ID** affiche -> C'EST TON `APPLE_KEY_ID`

---

### Etape 5 : Recuperer ton Team ID

1. En haut a droite sur developer.apple.com, tu vois ton nom
2. Ton **Team ID** est affiche (format : 10 caracteres alphanumeriques, ex: `ABC1234DEF`)
3. C'EST TON `APPLE_TEAM_ID`

---

### Etape 6 : Configurer les variables d'environnement

```bash
# Dans ton .env.local :
APPLE_CLIENT_ID=fr.petanquepro.auth
APPLE_TEAM_ID=ABC1234DEF
APPLE_KEY_ID=XYZ9876543

# La cle privee : ouvre le fichier .p8, copie tout le contenu
# et remplace les retours a la ligne par \n
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMG...reste_de_la_cle...\n-----END PRIVATE KEY-----

APPLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/apple/callback
```

**Pour formater la cle privee .p8** :
```bash
# Sur Linux/Mac, cette commande convertit le fichier en une seule ligne :
cat AuthKey_XYZ9876543.p8 | tr '\n' '|' | sed 's/|/\\n/g'
```

---

## CONFIGURATION SERVEUR (VPS)

### Ajout des variables d'environnement

```bash
nano ~/petanquepro.fr/petanque-app/.env.local
```

Ajoutez :
```bash
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

APPLE_CLIENT_ID=fr.petanquepro.auth
APPLE_TEAM_ID=votre_team_id
APPLE_KEY_ID=votre_key_id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/apple/callback
```

Sauvegardez (`Ctrl+X`, `Y`, `Entree`) et redemarrez l'app :
```bash
pm2 restart petanque
```

---

## VERIFICATION

### Test de connexion Google

1. Allez sur `https://petanquepro.fr/login`
2. Cliquez sur le bouton **"Google"**
3. Vous devriez etre redirige vers Google
4. Acceptez les permissions
5. Vous devriez etre connecte et redirige vers `/dashboard`

### Test de connexion Apple

1. Allez sur `https://petanquepro.fr/login`
2. Cliquez sur le bouton **"Apple"**
3. Vous devriez etre redirige vers Apple
4. Connectez-vous avec votre Apple ID
5. Choisissez de partager ou masquer votre email
6. Vous devriez etre connecte et redirige vers `/dashboard`

---

## DEPANNAGE

### Erreur `redirect_uri_mismatch` (Google)

**Probleme** : L'URL de redirection ne correspond pas.

**Solution** :
1. Verifiez que `GOOGLE_REDIRECT_URI` dans `.env` est exactement `https://petanquepro.fr/api/auth/oauth/google/callback`
2. Verifiez dans Google Cloud Console que l'URI est bien configuree (sans slash a la fin)
3. Redemarrez l'app

### Erreur `invalid_client` (Apple)

**Probleme** : La configuration Apple est incorrecte.

**Solution** :
1. Verifiez que `APPLE_CLIENT_ID` correspond bien au **Service ID** (pas l'App ID)
2. Verifiez que la Return URL dans le Service ID est exactement `https://petanquepro.fr/api/auth/oauth/apple/callback`
3. Verifiez que la cle privee est correctement formatee avec `\n`
4. Verifiez que le Key ID et Team ID sont corrects

### Erreur `email_required` (Apple)

**Probleme** : L'utilisateur a choisi de masquer son email et le relay Apple n'est pas configure.

**Solution** :
- L'email est obligatoire pour creer un compte
- Si l'utilisateur choisit "Hide My Email", Apple fournit un email relay (@privaterelay.appleid.com)
- Cet email relay fonctionne normalement, le compte sera cree avec

### L'app est en mode test

**Probleme** : Seuls les testeurs ajoutes peuvent se connecter.

**Solution** :
- **Google** : Publiez l'app dans OAuth consent screen
- **Apple** : Apple Sign In fonctionne immediatement en production une fois configure

---

## SECURITE

### Bonnes pratiques

1. **Ne JAMAIS commiter** les secrets dans Git
2. **Utilisez HTTPS** en production (obligatoire pour OAuth)
3. **Verifiez les emails** retournes par les providers
4. **Limitez les scopes** aux permissions minimales necessaires
5. **Rotation des secrets** : changez-les regulierement

### Scopes demandes

- **Google** : `openid`, `email`, `profile`
- **Apple** : `name`, `email`

Ces scopes sont suffisants pour creer un compte et connecter l'utilisateur.

---

## RESSOURCES

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Sign In with Apple Documentation](https://developer.apple.com/documentation/sign_in_with_apple)
- [OAuth 2.0 Spec](https://oauth.net/2/)

---

## NOTES

- Les comptes crees via OAuth n'ont **pas de mot de passe**
- Les utilisateurs ne peuvent se connecter que via le provider utilise initialement
- Les ID des providers sont stockes dans `metadata.google_id` ou `metadata.apple_id`
- Apple ne renvoie le nom de l'utilisateur que lors de la **premiere connexion**
- Si l'utilisateur choisit "Hide My Email" avec Apple, un email relay est fourni

---

**Cree le** : 2025-11-02
**Mis a jour** : 2026-02-18
**Auteur** : Claude Code
**Version** : 2.0

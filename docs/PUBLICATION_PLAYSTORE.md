# Publier Pétanque Pro sur le Play Store (version Capacitor + AdMob)

Identité de l'app (déjà configurée) :
- **Nom** : Pétanque Pro
- **Package** : `fr.petanquepro.app`  ← définitif, jamais modifiable après publication
- **Version** : versionName `1.0`, versionCode `1`

---

## Étape 1 — Compte Google Play Console
1. https://play.google.com/console → se connecter avec ton compte Google.
2. Payer les **25 $** (une seule fois, à vie).
3. Choisir un **nom de développeur** (celui qui apparaît publiquement — « Pixfeed » ou « Pétanque Pro », à toi de voir).
4. Compléter le profil (adresse, contact).

## Étape 2 — Identifiants AdMob (avant de construire)
1. https://admob.google.com → créer une app Android → récupérer :
   - **App ID** : `ca-app-pub-XXXX~YYYY`
   - un bloc **Bannière** et un bloc **Interstitiel** : `ca-app-pub-XXXX/ZZZZ`
2. Renseigner (voir `docs/ADMOB.md`) :
   - `.env.local` : `NEXT_PUBLIC_ADMOB_BANNER_ID`, `NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID`
   - `android/app/src/main/AndroidManifest.xml` : remplacer l'App ID de test par le tien.
> Tu peux publier une v1 avec les pubs de TEST puis mettre les vrais IDs en v2 — mais autant les mettre tout de suite.

## Étape 3 — Construire le `.aab` signé (sur ton PC Windows)
1. Installer **Android Studio** : https://developer.android.com/studio (inclut le SDK + Java).
2. Récupérer le projet à jour puis synchroniser Capacitor :
   ```bash
   npm install
   npm run build
   npm run android:sync
   npm run android:open      # ouvre android/ dans Android Studio
   ```
3. Dans Android Studio : **Build → Generate Signed Bundle / APK → Android App Bundle**.
4. **Créer une clé de signature** (keystore) la première fois → **SAUVEGARDE-LA + le mot de passe**
   dans un endroit sûr. ⚠️ Sans cette clé, tu ne pourras **jamais** publier de mise à jour.
5. Choisir la variante **release** → tu obtiens `app-release.aab`.

> À chaque nouvelle version : incrémente `versionCode` (2, 3, …) et `versionName` (1.1, …)
> dans `android/app/build.gradle`, sinon le Play Store refuse l'upload.

## Étape 4 — Créer l'app dans la Play Console
« Créer une application » → nom **Pétanque Pro**, langue par défaut **français**, type **Application**, **Gratuite**.

### Fiche du store (textes prêts à coller — cf. section « Contenu » plus bas)
- Titre, description courte, description complète
- **Icône** 512×512 (PNG) — tu peux exporter `public/icons/icon-512.png`
- **Image de bandeau** 1024×500 (à créer)
- **Captures d'écran** téléphone : min 2, idéalement 4–8 (voir liste plus bas)
- **Lien politique de confidentialité** : `https://petanquepro.fr/legal/privacy` (déjà en ligne)

### Captures d'écran à faire (depuis l'app, format téléphone ~1080×1920)
1. Le **tableau de bord** (liste des tournois)
2. La **création d'un tournoi** (choix du mode)
3. Un **match en cours** (saisie du score mène par mène)
4. Le **classement / poules**
5. Le **podium** de fin de tournoi
6. (option) L'**espace joueur** `/moi`

## Étape 5 — Formulaires obligatoires

### « Contient des annonces »
Coche **OUI** (tu as AdMob).

### Classification du contenu (questionnaire)
- Catégorie : **Application** (pas jeu) → **Sport / Outils**
- Violence, contenu sexuel, etc. : **Non** partout → tu obtiendras **PEGI 3 / Tout public**.

### Sécurité des données (Data safety) — réponses
L'app **collecte** :
| Donnée | Collectée | Partagée | Pourquoi |
|---|---|---|---|
| **Adresse e-mail** | Oui | Non | Compte / connexion |
| **Nom** | Oui | Non | Compte, fiches joueurs |
| **ID de l'appareil (publicité)** | Oui | **Oui (Google AdMob)** | **Publicité** |
| Activité dans l'app (tournois, scores) | Oui | Non | Fonctionnement |
| Diagnostics / plantages | Oui (via AdMob/Google) | Oui | Stabilité |
- Données **chiffrées en transit** : **Oui** (HTTPS).
- L'utilisateur peut **demander la suppression** : **Oui** (`/parametres` → export + fermeture de compte).
- Le mot de passe est **haché** (pas « collecté » au sens exploitable).
> ⚠️ La ligne **« ID appareil / publicité, partagée, pour la publicité »** est **obligatoire** dès qu'on utilise AdMob — ne l'oublie pas, Google vérifie.

### Public cible
- Tranche d'âge : **18 ans et plus** (ou 13+). Évite « enfants » (ça impose des règles pub strictes).

## Étape 6 — Publier
1. Uploader le `.aab` dans un canal : commence par **Test interne** (toi + quelques amis) pour vérifier, puis **Production**.
2. Remplir toutes les sections jusqu'à ce qu'elles soient **vertes**.
3. **Envoyer pour examen** → Google relit (de quelques heures à ~2-3 jours pour une 1ʳᵉ app).
4. Une fois approuvée → l'app est **en ligne** sur le Play Store 🎉

---

## Contenu prêt à coller — Fiche du store

**Titre (max 30 car.)**
```
Pétanque Pro
```

**Description courte (max 80 car.)**
```
Organisez et gérez vos tournois de pétanque : équipes, scores, classements.
```

**Description complète (max 4000 car.)**
```
Pétanque Pro est l'application de référence pour organiser et gérer vos tournois de pétanque, du petit concours entre amis à la compétition de club.

⚡ CRÉEZ UN TOURNOI EN QUELQUES SECONDES
Choisissez votre format (tête-à-tête, doublette, triplette) et votre mode :
• Mode choisi : composez vous-même les équipes
• Mêlée fixe : équipes tirées au sort
• Mêlée tournante : nouveaux coéquipiers à chaque partie
• Personnalisé : construisez vos propres règles (manches, poules, élimination)

🎯 GÉREZ LES PARTIES EN DIRECT
• Saisie du score mène par mène
• Terrains attribués automatiquement
• Classements et départage FIPJP en temps réel
• Phases finales et podium automatiques

👥 VOS JOUEURS, VOTRE CLUB
• Fichier joueurs avec statistiques
• Les joueurs peuvent créer un compte et suivre leurs tournois
• Notification « c'est à vous de jouer » quand leur match est prêt
• Invitations par lien, QR code ou code club

🏆 UN OUTIL COMPLET
• Historique et statistiques des joueurs
• Export des résultats (PDF, tableur)
• Diplômes de champion à imprimer
• Fonctionne sur téléphone, tablette et ordinateur (mêmes données partout)

Que vous soyez président de club, animateur ou simple passionné, Pétanque Pro vous fait gagner du temps et rend vos concours plus pros.

Bonne pétanque à tous !
```

**Mots-clés / catégorie**
- Catégorie : **Sports**
- Tags : pétanque, tournoi, boules, concours, club, sport

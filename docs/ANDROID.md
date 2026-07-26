# Android — publier Pétanque Pro sur le Play Store

Le web reste la source unique : l'app Android n'est qu'une **coquille** qui affiche
`petanquepro.fr`. Un déploiement web met donc l'Android à jour **sans re-soumission**.
Deux chemins coexistent dans le repo — tu choisis lequel tu publies.

---

## Prérequis communs
- La PWA est en place (`app/manifest.ts`, `public/sw.js`, icônes). Elle doit être
  **déployée en prod** pour que les deux approches fonctionnent.
- Un compte **Google Play Console** (25 $, une seule fois).

---

## Chemin A — TWA / `.aab` (le plus simple, à publier en premier)

Emballe le site tel quel, **zéro code natif**.

1. Va sur **https://www.pwabuilder.com**, colle `https://petanquepro.fr`.
2. Onglet **Android → Google Play** → télécharge le paquet (`.aab` + `signing key`).
3. **Digital Asset Links** : PWABuilder te donne l'empreinte SHA-256 de la clé.
   - Colle-la dans `public/.well-known/assetlinks.json` (remplace le placeholder).
   - Vérifie que `package_name` correspond (par défaut `fr.petanquepro.twa`).
   - **Redéploie le web** → l'URL `https://petanquepro.fr/.well-known/assetlinks.json`
     doit renvoyer le JSON. C'est ce qui enlève la barre d'URL dans l'app.
4. Upload du `.aab` dans la Play Console.

> Garde précieusement la **clé de signature** : sans elle, impossible de publier une mise à jour.

---

## Chemin B — Capacitor (natif, pour les améliorations futures)

Un vrai projet Android (`android/`) déjà généré dans le repo. Charge la prod
(`server.url` dans `capacitor.config.ts`) mais donne accès aux **plugins natifs**
(push, partage, contacts, biométrie…) quand on en aura besoin.

### Construire
1. Installe **Android Studio** (fournit le SDK).
2. À la racine du projet :
   ```bash
   npm install
   npm run android:sync     # synchronise config + assets vers android/
   npm run android:open     # ouvre le projet dans Android Studio
   ```
3. Dans Android Studio : **Build → Generate Signed Bundle / APK → Android App Bundle**,
   crée (ou réutilise) une clé de signature → produit le `.aab`.

### Tester sur un serveur local (dev)
```bash
CAP_SERVER_URL=http://192.168.1.20:3000 npm run android:sync
npm run android:open
```
(remplace par l'IP de ta machine sur le réseau local ; le téléphone doit y accéder)

### Régénérer les icônes / le splash
Les sources sont générées depuis `app/icon.svg` :
```bash
npm run android:assets    # régénère assets/ puis les mipmaps Android
```

### Ajouter un plugin natif plus tard (exemple : notifications push)
```bash
npm install @capacitor/push-notifications
npm run android:sync
```
puis utiliser l'API du plugin dans le code web (elle no-op sur le navigateur, active sur l'app).

---

## Quel `appId` / `package_name` ?
- TWA : `fr.petanquepro.twa` (modifiable dans PWABuilder)
- Capacitor : `fr.petanquepro.app` (dans `capacitor.config.ts` + `android/`)

Sur le Play Store, **un seul** `package_name` = une seule fiche app. Choisis
l'approche que tu publies et garde ce `package_name` stable pour toujours
(il ne peut jamais être réutilisé/changé après publication).

---

## Récap fichiers
| Fichier | Rôle |
|---|---|
| `app/manifest.ts`, `public/sw.js`, `public/offline.html` | PWA (base des deux chemins) |
| `public/.well-known/assetlinks.json` | Vérification TWA (chemin A) |
| `capacitor.config.ts` | Config Capacitor (chemin B) |
| `android/` | Projet Android Capacitor (chemin B) |
| `scripts/gen-pwa-icons.mjs` | Icônes PWA |
| `scripts/gen-capacitor-assets.mjs` | Icônes/splash Android |

# Notifications push

Deux canaux, choisis automatiquement selon l'appareil :

| Canal | Cible | Compte externe ? | État |
|---|---|---|---|
| **Web Push (VAPID)** | PWA installée (Android/desktop) + TWA | ❌ Aucun | ✅ Prêt & fonctionnel |
| **FCM** | App **native** Capacitor | ✅ Projet Firebase | 🟡 Jetons stockés, envoi actif dès config Firebase |

## Comment ça marche (bout en bout)
1. L'utilisateur clique **« Activer les notifications »** (page *Paramètres*).
2. Le client (`lib/push/client.ts`) demande la permission puis :
   - web → s'abonne via le service worker (`pushManager.subscribe`) et POST `/api/push/subscribe`
   - natif → récupère le jeton FCM et POST le même endpoint
3. Le serveur stocke l'abonnement (`push_subscriptions`, migration 009).
4. Un envoi (`lib/push/server.ts → sendPushToUser`) pousse à **tous** les appareils de l'utilisateur.
5. Le service worker (`public/sw.js`) reçoit l'événement `push` et affiche la notification ;
   au clic, il ouvre l'URL portée par le message.

**Déclencheur déjà branché** : à la clôture d'un tournoi, l'organisateur reçoit
« 🏆 Tournoi terminé » (lien vers le podium).

## Configuration serveur

### Web Push (obligatoire pour activer le push web)
Générer une paire de clés VAPID **une seule fois** :
```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```
Puis renseigner en prod (`.env.local`) :
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # clé publique
VAPID_PRIVATE_KEY=...              # clé privée (secret)
VAPID_SUBJECT=mailto:contact@petanquepro.fr
```
> ⚠️ La clé publique est aussi utilisée côté navigateur (`NEXT_PUBLIC_`), c'est normal.
> La clé privée reste **secrète** (jamais commitée).

### FCM (optionnel — seulement pour l'app native Capacitor)
1. Créer un projet **Firebase** → ajouter une app Android (`fr.petanquepro.app`).
2. Télécharger `google-services.json` → le placer dans `android/app/`.
3. Créer un **compte de service** (Firebase → Paramètres → Comptes de service → générer une clé).
4. Coller le JSON (sur une ligne) dans `.env.local` :
   ```
   FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
Sans ces étapes, les jetons FCM sont quand même stockés ; l'envoi natif s'active
dès que la variable est présente (aucun code à changer).

## Tester
1. Déployer le web (le service worker et les clés VAPID ne servent qu'en prod/HTTPS).
2. Installer la PWA (ou ouvrir dans Chrome Android).
3. *Paramètres* → **Activer les notifications** → **Envoyer un test**.

## Envoyer une notification depuis le code
```ts
import { sendPushToUser } from '@/lib/push/server'
await sendPushToUser(userId, {
  title: 'Titre',
  body: 'Message',
  url: '/dashboard',   // ouvert au clic
  tag: 'clef-unique',  // regroupe/remplace les notifications
})
```

## Fichiers
| Fichier | Rôle |
|---|---|
| `database/migrations/009_create_push_subscriptions.sql` | Table des abonnements |
| `lib/push/server.ts` | Envoi (Web Push + FCM), enregistrement, purge |
| `lib/push/client.ts` | Activation/désactivation côté client |
| `app/api/push/{subscribe,unsubscribe,test}/route.ts` | Endpoints |
| `public/sw.js` | Réception `push` + clic |
| `components/NotificationsCard.tsx` | UI dans *Paramètres* |

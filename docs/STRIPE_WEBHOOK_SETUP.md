# Configuration Webhook Stripe

Ce document explique comment configurer le webhook Stripe pour gérer les abonnements automatiquement.

## Pourquoi un webhook ?

Le webhook Stripe permet de **synchroniser automatiquement** le statut Premium avec les événements d'abonnement :

- ✅ **Renouvellement annuel** : L'utilisateur paie → Premium maintenu
- ❌ **Échec de paiement** : La carte expire → Retour au plan gratuit
- 🔄 **Annulation** : L'utilisateur annule → Fin de l'abonnement
- 🎁 **Période d'essai** : Si activée → Premium temporaire

**Sans webhook**, vous devriez vérifier manuellement le statut de chaque abonnement. Avec le webhook, tout est automatique !

## Architecture

```
Stripe → Webhook → API Next.js → Base de données
                      ↓
              Met à jour le plan
              (free ou premium)
```

## Étape 1 : Créer l'endpoint dans l'application

✅ **Déjà fait !** Le fichier `/app/api/webhooks/stripe/route.ts` a été créé.

Il gère ces événements :
- `customer.subscription.created` - Nouvel abonnement
- `customer.subscription.updated` - Abonnement modifié
- `customer.subscription.deleted` - Abonnement annulé
- `invoice.payment_succeeded` - Paiement réussi (renouvellement)
- `invoice.payment_failed` - Paiement échoué
- `checkout.session.completed` - Fin du checkout

## Étape 2 : Configurer la variable d'environnement

Ajoutez dans votre fichier `.env.local` (développement) et `.env` (production) :

```bash
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Note** : Cette clé sera fournie par Stripe à l'étape suivante.

## Étape 3 : Configurer le webhook dans Stripe Dashboard

### 3.1 Accéder aux Webhooks

1. Connectez-vous à [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **Développeurs** → **Webhooks**
3. Cliquez sur **+ Ajouter un endpoint**

### 3.2 Configurer l'URL

**En développement (test local)** :

Pour tester en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# ou téléchargez sur https://stripe.com/docs/stripe-cli

# Se connecter
stripe login

# Transférer les webhooks vers votre localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le webhook secret affiché (commence par whsec_)
# et l'ajouter dans .env.local
```

**En production** :

URL : `https://petanquepro.fr/api/webhooks/stripe`

### 3.3 Sélectionner les événements

Cochez ces événements (ou sélectionnez "Tous les événements" pour simplifier) :

**Abonnements** :
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end` (optionnel)

**Paiements** :
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Checkout** :
- ✅ `checkout.session.completed`

### 3.4 Récupérer le Webhook Secret

1. Une fois le webhook créé, cliquez dessus
2. Dans la section **Signing secret**, cliquez sur **Révéler**
3. Copiez la clé (format : `whsec_xxxxxxxxxxxxxxxxxxxxx`)
4. Ajoutez-la dans votre `.env` :

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Étape 4 : Tester le webhook

### Test en local avec Stripe CLI

```bash
# Terminal 1 : Lancer l'application
npm run dev

# Terminal 2 : Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 : Déclencher un événement de test
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

Vérifiez les logs dans votre terminal Next.js pour voir les webhooks reçus.

### Test en production

1. Créez un abonnement de test dans Stripe Dashboard
2. Allez dans **Développeurs** → **Webhooks** → Votre webhook
3. Cliquez sur l'onglet **Événements récents**
4. Vous devriez voir les événements envoyés avec le statut `200 OK`

### Simuler des scénarios

**Renouvellement annuel** :
```bash
stripe trigger invoice.payment_succeeded
```

**Échec de paiement** :
```bash
stripe trigger invoice.payment_failed
```

**Annulation d'abonnement** :
```bash
stripe trigger customer.subscription.deleted
```

## Étape 5 : Vérifier la base de données

Après chaque événement webhook, vérifiez que la base de données est bien mise à jour :

```sql
-- Vérifier le plan de l'utilisateur
SELECT id, email, metadata->'subscription' as subscription
FROM users
WHERE id = 'USER_ID';

-- Vérifier le plan de l'organisation
SELECT id, name, settings->'plan' as plan
FROM organisations
WHERE id = 'ORG_ID';

-- Vérifier les paiements
SELECT user_id, amount, currency, status, completed_at
FROM payment_attempts
ORDER BY created_at DESC
LIMIT 10;
```

## Sécurité du webhook

### Vérification de la signature

Le code vérifie automatiquement la signature du webhook avec :

```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

Cela garantit que :
- ✅ Le webhook provient bien de Stripe (pas d'un attaquant)
- ✅ Le contenu n'a pas été modifié
- ✅ Le webhook n'est pas une replay attack

### Bonnes pratiques

1. **Ne jamais exposer** `STRIPE_WEBHOOK_SECRET` publiquement
2. **Toujours vérifier** la signature avant de traiter le webhook
3. **Logger** tous les événements pour débogage
4. **Gérer les erreurs** gracieusement (renvoyer 200 même si erreur interne)
5. **Idempotence** : Gérer les webhooks dupliqués (peut arriver)

## Gestion des cas limites

### Webhook dupliqué

Stripe peut envoyer le même webhook plusieurs fois. Le code gère ça avec :

```sql
ON CONFLICT (stripe_session_id) DO UPDATE
```

### Webhook en retard

Si le webhook arrive après que l'utilisateur a déjà vu la page de succès, pas de problème : la base de données sera quand même mise à jour.

### Webhook perdu

Stripe réessaie automatiquement jusqu'à 3 jours. Vérifiez la section "Événements récents" dans le dashboard.

## Logs et débogage

### Logs du webhook

Le code log tous les événements :

```typescript
console.log('Webhook reçu:', event.type)
console.log(`✅ Utilisateur ${userId} mis à jour vers plan ${plan}`)
console.log(`⚠️ Paiement échoué pour l'abonnement ${subscriptionId}`)
```

Vérifiez les logs de votre serveur (PM2, Docker, etc.) :

```bash
# Logs PM2
pm2 logs petanque-app

# Logs en production
journalctl -u petanque-app -f

# Logs Docker
docker logs petanque-app -f
```

### Dashboard Stripe

Allez dans **Développeurs** → **Webhooks** → Votre webhook → **Événements récents**

Vous pouvez :
- Voir tous les webhooks envoyés
- Voir le statut (200 OK, 400 Bad Request, 500 Server Error)
- Réessayer un webhook manuellement
- Voir le payload JSON

## Tableau de flux complet

| Événement | Déclencheur | Action | Résultat |
|-----------|-------------|--------|----------|
| `checkout.session.completed` | Utilisateur paie la première fois | Active Premium | Plan → premium |
| `customer.subscription.created` | Abonnement créé | Active Premium | Plan → premium |
| `invoice.payment_succeeded` | Renouvellement annuel réussi | Enregistre le paiement | Plan → premium (maintenu) |
| `invoice.payment_failed` | Carte expirée, refusée | Enregistre l'échec + Email | Plan → premium (temporaire) |
| `customer.subscription.updated` | Statut change (active, past_due) | Met à jour le plan | Plan selon status |
| `customer.subscription.deleted` | Utilisateur annule | Désactive Premium | Plan → free |

## Configuration des métadonnées

Le webhook utilise `user_id` et `user_email` dans les métadonnées. Ces valeurs sont définies lors de la création de la session checkout dans `/app/api/create-checkout-session/route.ts` :

```typescript
metadata: {
  user_id: userId,
  user_email: userEmail,
  product: 'premium_yearly'
}
```

**Important** : Sans ces métadonnées, le webhook ne peut pas identifier l'utilisateur !

## Résolution des problèmes

### Webhook non reçu

**Vérifications** :
1. URL correcte dans Stripe Dashboard
2. Port ouvert (production)
3. HTTPS activé (production)
4. Firewall ne bloque pas Stripe
5. Vérifier les logs du serveur

### Webhook reçu mais erreur 400

**Causes possibles** :
1. `STRIPE_WEBHOOK_SECRET` incorrect
2. Signature invalide
3. Body de la requête modifié

**Solution** : Vérifier la variable d'environnement

### Webhook reçu mais erreur 500

**Causes possibles** :
1. Base de données inaccessible
2. Erreur SQL
3. `user_id` manquant dans les métadonnées

**Solution** : Vérifier les logs et la base de données

### Plan pas mis à jour

**Vérifications** :
1. Webhook bien reçu (logs)
2. `user_id` présent dans les métadonnées
3. Requête SQL exécutée sans erreur
4. Rafraîchir la page du dashboard

## Monitoring en production

### Alertes recommandées

1. **Webhook échoue > 5 fois** → Email admin
2. **Paiement échoue** → Email utilisateur + admin
3. **Abonnement annulé** → Email marketing (reconquête)

### Métriques à suivre

- Taux de succès des webhooks (objectif : >99%)
- Temps de traitement moyen (<500ms)
- Nombre de paiements échoués
- Taux d'annulation (objectif : <20%)

## Checklist de déploiement

Avant de déployer en production :

- [ ] Webhook créé dans Stripe Dashboard (mode production)
- [ ] `STRIPE_WEBHOOK_SECRET` défini dans `.env`
- [ ] URL webhook HTTPS configurée
- [ ] Événements sélectionnés dans Stripe
- [ ] Test avec `stripe trigger` réussi
- [ ] Logs vérifiés (webhooks reçus)
- [ ] Base de données mise à jour correctement
- [ ] Plan de monitoring en place

## Ressources

- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Tester les webhooks](https://stripe.com/docs/webhooks/test)
- [Événements Stripe](https://stripe.com/docs/api/events/types)

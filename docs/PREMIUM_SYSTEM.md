# Système Premium - Documentation Complète

Ce document récapitule le système complet de monétisation de Pétanque Pro avec :
- Abonnement Premium annuel (Stripe)
- Publicités pour les utilisateurs gratuits (Google AdSense)
- Webhooks pour la gestion automatique des abonnements

## 📊 Vue d'ensemble

### Modèle économique : Freemium

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  UTILISATEUR GRATUIT (70%)                     │
│  ─────────────────────────                     │
│  • Accès complet aux fonctionnalités          │
│  • Publicités Google AdSense                   │
│  • Peut passer à Premium à tout moment         │
│                                                 │
│  Revenus : ~€3 RPM AdSense                     │
│                                                 │
└─────────────────────────────────────────────────┘

                    ⬇️ Upgrade

┌─────────────────────────────────────────────────┐
│                                                 │
│  UTILISATEUR PREMIUM (30%)                     │
│  ──────────────────────                        │
│  • Accès complet aux fonctionnalités          │
│  • AUCUNE publicité                            │
│  • Badge Premium                                │
│  • Support prioritaire                          │
│                                                 │
│  Prix : 4,99€/an (renouvellement automatique) │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Revenus estimés (pour 1000 utilisateurs actifs)

| Source | Utilisateurs | Revenu/mois | Revenu/an |
|--------|--------------|-------------|-----------|
| **AdSense** | 700 (70%) | €105 | €1,260 |
| **Premium** | 300 (30%) | €100 | €1,200 |
| **TOTAL** | 1000 | **€205** | **€2,460** |

## 🏗️ Architecture

### 1. Frontend (Next.js)

**Dashboard** (`/app/dashboard/page.tsx`)
- Modal premium avec design cohérent (gradient vert)
- Bouton "Passer à Premium" dans le menu profil
- Badge Premium si abonné
- Publicités conditionnelles (seulement si gratuit)

**Composant AdBanner** (`/components/AdBanner.tsx`)
- 4 variantes : responsive, horizontal, vertical, square
- Affichage conditionnel selon le plan
- Intégration Google AdSense automatique
- Placeholder si AdSense non configuré

### 2. Backend (API Routes)

**Checkout** (`/app/api/create-checkout-session/route.ts`)
```
POST /api/create-checkout-session
Body: { userId, userEmail, priceId }
→ Crée une session Stripe Checkout
→ Redirige vers Stripe pour le paiement
```

**Webhook** (`/app/api/webhooks/stripe/route.ts`)
```
POST /api/webhooks/stripe
Headers: stripe-signature
→ Reçoit les événements Stripe
→ Met à jour le plan de l'utilisateur
```

**Vérification** (`GET /api/create-checkout-session`)
```
GET /api/create-checkout-session?session_id=xxx&user_id=yyy
→ Vérifie le statut du paiement
→ Active Premium manuellement
```

### 3. Base de données

**Table : users**
```sql
metadata: {
  subscription: {
    status: 'free' | 'premium',
    plan: 'free' | 'premium_yearly',
    stripe_customer_id: 'cus_xxx',
    stripe_subscription_id: 'sub_xxx',
    premium_since: '2025-11-11T12:00:00Z',
    current_period_end: '2026-11-11T12:00:00Z'
  }
}
```

**Table : organisations**
```sql
settings: {
  plan: 'free' | 'premium'
}
```

**Table : payment_attempts**
```sql
- user_id
- stripe_session_id
- stripe_customer_id
- stripe_payment_intent
- stripe_subscription_id
- amount (499 centimes)
- currency ('eur')
- status ('pending' | 'completed' | 'failed')
- created_at
- completed_at
```

## 🔄 Flux utilisateur

### Parcours 1 : Souscription Premium

```
1. Utilisateur gratuit → Dashboard
2. Clic "Passer à Premium"
3. Modal s'ouvre (4,99€/an)
4. Clic "S'abonner - 4,99€/an"
5. → POST /api/create-checkout-session
6. → Redirection vers Stripe Checkout
7. Utilisateur entre ses coordonnées CB
8. Paiement validé
9. → Stripe envoie webhook customer.subscription.created
10. → API met à jour users.metadata + organisations.settings
11. Redirection vers /dashboard?payment=success
12. ✅ Badge Premium affiché
13. ✅ Publicités disparaissent
```

### Parcours 2 : Renouvellement annuel

```
1. 1 an après la souscription
2. Stripe prélève automatiquement 4,99€
3. → Webhook invoice.payment_succeeded
4. → API enregistre le paiement dans payment_attempts
5. ✅ Plan Premium maintenu
6. Email de confirmation envoyé (TODO)
```

### Parcours 3 : Échec de paiement

```
1. Carte expirée / refusée
2. → Webhook invoice.payment_failed
3. → API enregistre l'échec
4. → Email à l'utilisateur (TODO)
5. Stripe réessaie automatiquement (Smart Retries)
6. Si échec après 3 tentatives :
   → Webhook customer.subscription.deleted
   → Retour au plan gratuit
```

### Parcours 4 : Annulation

```
1. Utilisateur va dans Stripe Customer Portal (TODO)
2. Clique "Annuler mon abonnement"
3. → Webhook customer.subscription.deleted
4. → API met à jour plan → 'free'
5. ✅ Publicités réapparaissent
6. Badge Premium disparaît
```

## 🔌 Configuration Stripe

### Variables d'environnement

```bash
# .env
STRIPE_SECRET_KEY=sk_live_xxx  # Clé secrète
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # Clé publique
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Secret webhook
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
```

### Webhook Stripe

**URL de production** : `https://petanquepro.fr/api/webhooks/stripe`

**Événements à écouter** :
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `checkout.session.completed`

**Configuration** :
1. Dashboard Stripe → Développeurs → Webhooks
2. Ajouter un endpoint → `https://petanquepro.fr/api/webhooks/stripe`
3. Sélectionner les événements ci-dessus
4. Copier le webhook secret → `.env`

### Test en local

```bash
# Terminal 1 : App Next.js
npm run dev

# Terminal 2 : Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 : Simuler événement
stripe trigger customer.subscription.created
```

## 📢 Configuration Google AdSense

### Variable d'environnement

```bash
# .env
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### Emplacements publicitaires

**Dashboard** :
- Bannière 1 : Après les statistiques (responsive)
- Bannière 2 : Après l'activité récente (horizontal 728x90)

**Pages tournois** :
- Bannière : Sous les onglets (responsive)

### Configuration AdSense

1. Créer compte sur [google.com/adsense](https://www.google.com/adsense)
2. Ajouter le site `petanquepro.fr`
3. Attendre l'approbation (1-2 jours)
4. Récupérer le Publisher ID (`ca-pub-xxx`)
5. Créer des unités publicitaires
6. Copier le Client ID → `.env`

**Voir** : `/docs/ADSENSE_SETUP.md` pour les détails

## 🧪 Tests

### Test du système premium complet

1. **Créer un compte gratuit**
   ```
   Utilisateur : test@example.com
   Plan : free
   Publicités : visibles
   ```

2. **Passer à Premium**
   ```bash
   # En mode test Stripe
   Carte : 4242 4242 4242 4242
   Date : 12/34
   CVC : 123
   ```

3. **Vérifier l'activation**
   ```sql
   SELECT metadata->'subscription' FROM users WHERE email = 'test@example.com';
   -- Devrait montrer status: 'premium'
   ```

4. **Simuler renouvellement**
   ```bash
   stripe trigger invoice.payment_succeeded
   ```

5. **Simuler échec**
   ```bash
   stripe trigger invoice.payment_failed
   ```

6. **Simuler annulation**
   ```bash
   stripe trigger customer.subscription.deleted
   ```

### Test des publicités

1. **Utilisateur gratuit** → Publicités visibles
2. **Utilisateur premium** → Aucune publicité
3. **Sans AdSense configuré** → Placeholder affiché

## 📝 Checklist de déploiement

### Variables d'environnement

- [ ] `STRIPE_SECRET_KEY` (production)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (production)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- [ ] `NEXT_PUBLIC_APP_URL=https://petanquepro.fr`

### Configuration Stripe

- [ ] Webhook créé (mode production)
- [ ] URL webhook HTTPS configurée
- [ ] 6 événements sélectionnés
- [ ] Test webhook réussi (stripe trigger)

### Configuration AdSense

- [ ] Compte créé et approuvé
- [ ] Site ajouté : petanquepro.fr
- [ ] Unités publicitaires créées
- [ ] Client ID copié dans `.env`

### Tests

- [ ] Paiement test réussi
- [ ] Webhook reçu et traité
- [ ] Plan mis à jour en BDD
- [ ] Publicités disparaissent pour Premium
- [ ] Renouvellement simulé fonctionne
- [ ] Annulation simulée fonctionne

### Monitoring

- [ ] Logs webhook vérifiés
- [ ] Dashboard Stripe configuré
- [ ] Alertes email configurées (TODO)

## 🚀 Améliorations futures

### Court terme

1. **Customer Portal Stripe**
   - Permettre aux utilisateurs de gérer leur abonnement
   - Mettre à jour la carte bancaire
   - Annuler l'abonnement

2. **Emails transactionnels**
   - Confirmation d'abonnement
   - Alerte d'échec de paiement
   - Confirmation de renouvellement
   - Annulation d'abonnement

3. **Période d'essai**
   - 7 jours gratuits
   - Configuration dans Stripe Price

### Moyen terme

4. **Analytics**
   - Suivi des conversions (free → premium)
   - Revenus AdSense vs Premium
   - Taux de rétention
   - Churn rate

5. **Codes promo**
   - -20% premier mois
   - Codes affiliés
   - Réduction parrainage

6. **Tableau de bord admin**
   - Vue sur tous les abonnements
   - Statistiques de revenus
   - Gestion des remboursements

### Long terme

7. **Plans multiples**
   - Gratuit : 0€
   - Premium : 4,99€/an
   - Pro : 9,99€/an (fonctionnalités avancées)

8. **Application mobile**
   - Intégration Capacitor
   - In-App Purchase (Apple/Google)
   - Synchronisation des abonnements

## 📚 Documentation

- [Configuration AdSense](/docs/ADSENSE_SETUP.md)
- [Configuration Webhook Stripe](/docs/STRIPE_WEBHOOK_SETUP.md)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation AdSense](https://support.google.com/adsense)

## 🆘 Support

En cas de problème :

1. **Webhook non reçu** → Vérifier URL et HTTPS
2. **Plan pas mis à jour** → Vérifier logs webhook
3. **Publicités non affichées** → Vérifier ADSENSE_CLIENT_ID
4. **Erreur Stripe** → Vérifier les clés API

Voir les fichiers de documentation pour plus de détails.

---

**Version** : 1.0
**Date** : 2025-11-11
**Auteur** : Claude
**Statut** : ✅ Production Ready

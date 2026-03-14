# Système d'abonnement - Documentation

Ce document décrit le système de monétisation de Pétanque Pro avec 3 plans tarifaires et paiement via Stripe.

## Vue d'ensemble

### 3 Plans tarifaires

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│                      │                      │                      │
│  GRATUIT (0€)        │  ESSENTIEL (9,99€/an)│  CLUB (19,99€/an)   │
│  ────────────        │  ─────────────────── │  ─────────────────── │
│  • 1 tournoi         │  • Tournois illimités │  • Tout Essentiel   │
│  • 8 équipes max     │  • Équipes illimitées │  • Stats avancées   │
│  • Tous modes de jeu │  • Export PDF/partage │  • Perso club       │
│  • Pas d'export PDF  │  • Historique tournois│  • Support priorit. │
│  • Pas d'historique  │                      │  • Mises à jour AVP  │
│                      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

## Architecture technique

### Base de données

Le plan est stocké dans `organisations.settings.plan` (JSONB) :
- `'free'` → Plan Gratuit
- `'essentiel'` → Plan Essentiel
- `'club'` → Plan Club

Le détail de l'abonnement est dans `users.metadata.subscription` :
```json
{
  "status": "essentiel",
  "plan": "essentiel_yearly",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx",
  "subscribed_since": "2025-01-01T00:00:00Z",
  "current_period_end": "2026-01-01T00:00:00Z"
}
```

### Endpoints Stripe

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/create-checkout-session` | POST | Crée une session Stripe (param `planType`: `essentiel` ou `club`) |
| `/api/create-checkout-session` | GET | Vérifie le statut d'un paiement |
| `/api/webhooks/stripe` | POST | Webhook Stripe (subscription.created/updated/deleted, invoice, checkout) |

### Variables d'environnement requises

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_ESSENTIEL=price_xxx    # Prix Stripe pour Essentiel (9,99€/an)
STRIPE_PRICE_ID_CLUB=price_xxx         # Prix Stripe pour Club (19,99€/an)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Flux de paiement

1. L'utilisateur clique "Choisir Essentiel" ou "Choisir Club" dans la modale upgrade
2. Le front envoie `POST /api/create-checkout-session` avec `{ userId, userEmail, planType: 'essentiel' | 'club' }`
3. Stripe crée une session checkout avec le bon `priceId`
4. L'utilisateur est redirigé vers Stripe pour payer
5. Après paiement, retour sur `/dashboard?payment=success&session_id=xxx`
6. Le GET vérifie le paiement et active le plan en base
7. Le webhook Stripe gère aussi l'activation (double sécurité)

### Limites du plan gratuit

Enforced côté API :
- **1 tournoi max** : vérifié dans `POST /api/tournois`
- **8 équipes max par tournoi** : vérifié dans `POST /api/equipes` et `POST /api/equipes/batch`

### Détection du plan côté front

- `AuthProvider.tsx` expose `isPremium` (true si plan = essentiel, club, ou premium legacy)
- `organization.settings.plan` contient le plan actuel
- `DashboardHeader` affiche le badge du plan (Gratuit / Essentiel / Club)

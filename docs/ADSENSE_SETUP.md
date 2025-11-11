# Configuration Google AdSense

Ce document explique comment configurer Google AdSense pour l'application Pétanque Pro.

## Prérequis

1. Compte Google AdSense approuvé
2. Application déployée sur un domaine (pas localhost)
3. Variables d'environnement configurées

## Étapes de configuration

### 1. Créer un compte Google AdSense

1. Rendez-vous sur [https://www.google.com/adsense](https://www.google.com/adsense)
2. Créez un compte ou connectez-vous
3. Ajoutez votre site web : `https://petanquepro.fr`
4. Attendez l'approbation (généralement 1-2 jours)

### 2. Récupérer votre Client ID

Une fois approuvé :

1. Dans votre dashboard AdSense, allez dans **Comptes** → **Paramètres**
2. Notez votre **Publisher ID** (format : `ca-pub-XXXXXXXXXXXXXXXX`)

### 3. Créer des unités publicitaires

1. Dans AdSense, allez dans **Annonces** → **Par unité publicitaire**
2. Créez les unités suivantes :

#### Annonce Responsive (Dashboard)
- **Nom** : Dashboard Banner
- **Type** : Display
- **Format** : Responsive
- **Taille** : Automatique

#### Annonce Horizontal (Sections)
- **Nom** : Horizontal Banner
- **Type** : Display
- **Format** : Horizontal
- **Taille** : 728x90 (Leaderboard)

3. Notez les **Slot IDs** de chaque unité

### 4. Configuration des variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```bash
# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**IMPORTANT** : Remplacez `XXXXXXXXXXXXXXXX` par votre vrai Client ID.

### 5. Déploiement

1. Commitez et poussez les changements
2. Déployez sur votre serveur de production
3. Vérifiez que les publicités s'affichent correctement

## Emplacements des publicités

### Dashboard (`/dashboard`)

- **Emplacement 1** : Après les statistiques (responsive)
- **Emplacement 2** : Après l'activité récente (horizontal)

### Pages de tournois (`/tournoi/[id]`)

- **Emplacement** : Sous les onglets (responsive)

## Comportement par plan

### Utilisateurs gratuits (`free`)
- Voient toutes les publicités
- Les publicités apparaissent entre les sections de contenu

### Utilisateurs Premium (`premium`)
- **Aucune publicité affichée**
- Navigation sans interruption
- Expérience premium complète

## Composant AdBanner

Le composant `AdBanner` est situé dans `/components/AdBanner.tsx` et supporte les variantes suivantes :

```tsx
<AdBanner
  variant="responsive" // ou "horizontal", "vertical", "square"
  userPlan={userPlan}  // "free" ou "premium"
  showOnlyForFree={true}
  adSlot="SLOT_ID"     // Optionnel
/>
```

### Variantes disponibles

| Variante | Dimensions | Usage |
|----------|-----------|-------|
| `responsive` | Auto | Dashboard, sections principales |
| `horizontal` | 728x90 | Banners entre sections |
| `vertical` | 160x600 | Sidebars (à implémenter) |
| `square` | 300x250 | Cards, modules |

## Test et vérification

### Mode développement (sans AdSense configuré)

Si `NEXT_PUBLIC_ADSENSE_CLIENT_ID` n'est pas défini, un placeholder s'affiche :

```
┌──────────────────────────┐
│      Publicité          │
│ Passez à Premium pour   │
│ supprimer les publicités │
└──────────────────────────┘
```

### Mode production (AdSense configuré)

1. Connectez-vous en tant qu'utilisateur gratuit
2. Vérifiez la présence des publicités sur :
   - `/dashboard`
   - `/tournoi/[id]`
3. Passez en Premium et vérifiez que les publicités disparaissent

## Optimisation des revenus

### Taux de clics (CTR)

- **Dashboard** : Emplacement premium, utilisateurs actifs
- **Pages tournois** : Trafic élevé pendant les événements

### Stratégies recommandées

1. **Codes promo** : Offrir `-20%` sur le premier mois pour inciter à l'abonnement
2. **A/B Testing** : Tester différents emplacements publicitaires
3. **Analyse** : Suivre les revenus AdSense vs conversions Premium
4. **Offre d'essai** : Envisager une période d'essai gratuite de 7 jours

### Objectifs

| Métrique | Objectif |
|----------|----------|
| Taux de conversion free → premium | 5-10% |
| Taux de rétention annuel | 70-80% |
| RPM AdSense (Revenue per Mille) | €2-5 |
| CTR moyen AdSense | 1-2% |

## Support technique

### Problème : Les publicités ne s'affichent pas

**Solutions** :

1. Vérifier que `NEXT_PUBLIC_ADSENSE_CLIENT_ID` est défini
2. Vérifier que le domaine est approuvé dans AdSense
3. Ouvrir la console du navigateur pour voir les erreurs
4. Attendre 24-48h après la première configuration

### Problème : "AdSense non configuré"

Vous avez oublié de définir la variable d'environnement. Ajoutez-la dans `.env.local` et redémarrez le serveur.

### Problème : Publicités vides ou blanches

AdSense met du temps à remplir les emplacements. Attendez quelques minutes et rechargez la page.

## Respect des règles AdSense

### À faire ✅

- Placer les publicités entre les sections de contenu
- Utiliser des labels clairs ("Publicité")
- Respecter les ratios contenu/publicité (70/30)

### À ne pas faire ❌

- Cliquer sur vos propres publicités
- Encourager les utilisateurs à cliquer
- Placer plus de 3 publicités par page
- Cacher les publicités ou les rendre trompeuses

## Revenus estimés

Basé sur les statistiques moyennes :

### Revenus publicitaires (AdSense)

| Métrique | Valeur |
|----------|--------|
| Utilisateurs gratuits | 70% |
| Pages vues / utilisateur / mois | 50 |
| RPM moyen | €3 |
| **Revenu mensuel AdSense (1000 utilisateurs actifs)** | **€105** |

### Revenus abonnements Premium

| Métrique | Valeur |
|----------|--------|
| Utilisateurs premium | 30% |
| Prix abonnement annuel | €4.99 |
| Taux de renouvellement | 80% |
| **Revenu annuel Premium (1000 utilisateurs actifs)** | **€1,197** |
| **Revenu mensuel Premium (1000 utilisateurs actifs)** | **€100** |

### Total estimé

Pour 1000 utilisateurs actifs :
- Revenus publicitaires : **€105/mois**
- Revenus premium : **€100/mois**
- **Total : €205/mois** soit **€2,460/an**

## Prochaines étapes

1. ✅ Composant AdBanner créé
2. ✅ Intégration dans Dashboard
3. ✅ Intégration dans pages Tournois
4. ⏳ Créer compte AdSense
5. ⏳ Obtenir approbation
6. ⏳ Configurer unités publicitaires
7. ⏳ Ajouter variables d'environnement
8. ⏳ Tester en production

## Contact

Pour toute question sur la configuration, consultez :
- [Documentation AdSense](https://support.google.com/adsense)
- [Politiques AdSense](https://support.google.com/adsense/answer/48182)

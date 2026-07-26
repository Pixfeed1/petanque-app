# Publicité mobile — AdMob (app native Capacitor)

La pub in-app passe par **AdMob** (pas AdSense — AdSense est interdit dans une app et
peut faire bannir le compte). Elle ne s'affiche **que dans l'app native Capacitor**, jamais
sur le web (tout est guardé par `isNative()`).

## Ce qui est déjà branché
| Emplacement | Où | Comportement |
|---|---|---|
| **Bannière** en bas | Dashboard (`components/NativeBanner`) | Affichée à l'entrée, retirée à la sortie |
| **Interstitiel** | Podium (fin de tournoi) | Plein écran ~2,5 s après l'arrivée sur le podium |
| Initialisation | `lib/native/index.ts → initAds()` | Au démarrage de l'app |

Toute la logique : `lib/native/ads.ts` (`showBanner`, `hideBanner`, `showInterstitial`).

## Par défaut : mode TEST (aucun revenu)
Sans identifiants configurés, l'app affiche les **pubs de démonstration Google** (test).
C'est **normal et voulu** : ça permet de tout tester sans risque et sans compte AdMob.
⚠️ Ne clique jamais sur tes propres vraies pubs — Google bannit pour ça (les pubs de test, elles, sont cliquables sans risque).

## Passer en production (vrais revenus)
1. Crée un compte **AdMob** : https://admob.google.com (gratuit, lié à ton compte Google).
2. Crée une **app** AdMob (Android) → tu obtiens un **App ID** (`ca-app-pub-XXXX~YYYY`).
3. Crée deux **blocs d'annonces** → un **Banner** et un **Interstitial** (`ca-app-pub-XXXX/ZZZZ`).
4. Renseigne-les :
   - dans `.env.local` :
     ```
     NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-XXXX/AAAA
     NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXX/BBBB
     ```
   - dans `android/app/src/main/AndroidManifest.xml`, remplace la valeur de test de
     `com.google.android.gms.ads.APPLICATION_ID` par ton **App ID**.
5. Rebuild : `npm run build && npm run android:sync`, puis régénère le `.aab` (Android Studio).

## Important
- **App ID obligatoire** dans le manifeste : sans lui, l'app native **crashe** au démarrage
  (une valeur de test est déjà en place pour éviter ça).
- La pub native ne marche qu'avec le build **Capacitor** (`android/`), pas avec le TWA/PWABuilder.
- Conformité : AdMob gère son propre consentement (UMP) ; pour l'UE tu peux activer un
  **message de consentement AdMob** dans la console AdMob (recommandé).

## Placer d'autres emplacements
Réutilise les helpers de `lib/native/ads.ts` :
```tsx
import { NativeBanner } from '@/components/NativeBanner'   // bannière sur une page
import { showInterstitial } from '@/lib/native/ads'        // interstitiel à un moment clé
```
Bon goût : garde la pub sur les écrans de **consultation** (dashboard, podium), **jamais**
pendant la saisie d'un score.

# Runbook déploiement — mise en ligne (à exécuter par l'admin)

Ordre : **1) déployer le web** → **2) vérifier PWA + push** → **3) générer le `.aab`** → **4) Play Console**.

---

## 0. Pré-requis IMPORTANT : fusionner vers `main`
`deploy.sh` déploie la branche **`main`** (`DEPLOY_BRANCH:-main`). Tout le travail de cette
session est sur `claude/petanque-pro-audit-el00el`. **Il faut d'abord le fusionner dans `main`.**

```bash
# via une Pull Request (recommandé) : ouvre la PR claude/petanque-pro-audit-el00el → main, relis, merge.
# ou en local :
git checkout main && git merge claude/petanque-pro-audit-el00el && git push origin main
```

---

## 1. Nouvelles variables d'environnement (prod)
Avant de déployer, ajoute dans le `.env.local` de prod (voir `.env.example` pour le détail) :

```
# Notifications push (obligatoire pour activer le push web) — générer une fois :
#   node -e "console.log(require('web-push').generateVAPIDKeys())"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@petanquepro.fr

# URL publique (utilisée pour les liens d'invitation joueur)
NEXT_PUBLIC_APP_URL=https://petanquepro.fr

# FCM (optionnel, seulement app native Capacitor) — cf. docs/NOTIFICATIONS_PUSH.md
# FCM_SERVICE_ACCOUNT_JSON=
```
> Sans les clés VAPID, l'app fonctionne mais le bouton « Activer les notifications »
> renverra « serveur non configuré » (503) — dégradation propre, rien ne casse.

---

## 2. Déployer le web
```bash
cd /chemin/vers/petanque-app
./deploy.sh          # pull main → npm install → migrations → build → (re)start
```
Le script applique automatiquement les **nouvelles migrations** `009` (push) et `010`
(comptes joueurs), suivies dans `.migrations_applied` (idempotent, une seule fois).

### ⚠️ Fiabilité du process (recommandé)
`deploy.sh` lance l'app avec `npm start` **au premier plan** : elle s'arrête si tu fermes
le terminal. Pour une prod stable, utilise **PM2** (un modèle existe : `ecosystem.config.js.example`) :
```bash
cp ecosystem.config.js.example ecosystem.config.js   # une fois
npm run build
pm2 start ecosystem.config.js      # ou : pm2 restart petanque
pm2 save && pm2 startup            # redémarre l'app au reboot serveur
```
(Alternative : un service `systemd`.) L'essentiel : que l'app **survive** à la déconnexion SSH.

---

## 3. Vérifier PWA + push (après déploiement)
1. Ouvre `https://petanquepro.fr` sur Chrome Android → menu → **« Installer l'application »** doit apparaître.
2. `https://petanquepro.fr/manifest.webmanifest` renvoie le manifeste.
3. `Paramètres → Activer les notifications → Envoyer un test` → tu reçois une notification.
4. Teste un lien d'invitation joueur (fiche joueur → « Générer un lien ») et le **code club** (`/rejoindre`).

---

## 4. Android (`.aab` + Play Console)
La PWA en prod est le pré-requis. La procédure complète est dans **`docs/ANDROID.md`** :
- Chemin rapide : **PWABuilder.com** → `.aab` → `assetlinks.json` → Play Console (25 $).
- Chemin natif (améliorations futures) : projet **Capacitor** dans `android/` (cf. même doc).

---

## Checklist
- [ ] Branche fusionnée dans `main`
- [ ] Variables VAPID + `NEXT_PUBLIC_APP_URL` en prod
- [ ] `./deploy.sh` OK (migrations 009/010 appliquées, build vert)
- [ ] App relancée via PM2/systemd (survit à la déconnexion)
- [ ] PWA installable + test de notification reçu
- [ ] (Sécurité) runbook `docs/SECURITE_RUNBOOK.md` exécuté
- [ ] `.aab` généré et uploadé (cf. `docs/ANDROID.md`)

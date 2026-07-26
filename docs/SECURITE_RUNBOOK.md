# Runbook sécurité — actions serveur (à exécuter par l'admin)

Ce document couvre les actions de sécurité qui touchent **le serveur de production**
et **tes accès** — je les ai préparées, tu les exécutes. La partie **code** est déjà
faite (voir plus bas « Déjà fait côté code »).

---

## 0. Bonne nouvelle : l'historique git est PROPRE
J'ai scanné **tout** l'historique (`git log --all -S/-p`) : **aucun secret réel** n'y a
jamais été commité — uniquement des espaces réservés (`ChangeMe`, `votre_mot_de_passe`,
`GENEREZ_UN_SECRET…`) et du code légitime. **Aucune réécriture d'historique n'est nécessaire.**

⚠️ *Mais* : si le mot de passe DB de prod a pu fuiter **ailleurs** (chat, capture d'écran,
logs, partage d'écran), la rotation ci-dessous reste prudente. Le fichier `.env.local` de
prod n'est pas dans le repo (vérifié : seul `.env.example` est suivi).

---

## 1. Rotation du mot de passe PostgreSQL (précaution)

Sur le serveur de prod :

```bash
# 1. Générer un mot de passe fort
NEWPW=$(openssl rand -base64 24)
echo "Nouveau mot de passe : $NEWPW"   # note-le

# 2. Le changer dans PostgreSQL
sudo -u postgres psql -c "ALTER USER jurojinn_petanque_user WITH PASSWORD '$NEWPW';"

# 3. Mettre à jour l'app (fichier d'env de prod, PAS dans le repo)
#    Édite le .env.local (ou le fichier d'env de ton service) :
#      POSTGRES_PASSWORD=<le nouveau mot de passe>
nano /chemin/vers/petanque-app/.env.local

# 4. Redémarrer l'app pour recharger l'env
pm2 restart petanque      # ou : sudo systemctl restart <ton-service>

# 5. Vérifier que l'app se reconnecte (logs)
pm2 logs petanque --lines 30
```

> Vérifie ensuite une action qui lit la base (connexion, liste des tournois) pour confirmer.

---

## 2. Vérifier les autres secrets d'environnement

Dans le `.env.local` de prod, assure-toi que ces valeurs sont **fortes et uniques** (jamais
les exemples) :

| Variable | Comment (re)générer |
|---|---|
| `JWT_SECRET` | `openssl rand -base64 32` (⚠️ changer déconnecte tout le monde — normal) |
| `POSTGRES_PASSWORD` | cf. §1 |
| `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `node -e "console.log(require('web-push').generateVAPIDKeys())"` |
| `GOOGLE_CLIENT_SECRET` | console Google Cloud (si tu penses qu'il a fuité) |

> Après avoir changé `JWT_SECRET`, tous les utilisateurs devront se reconnecter.

---

## 3. (Contingence uniquement) Purger un secret de l'historique git
**Non nécessaire** ici (§0). À n'utiliser QUE si tu sais qu'un vrai secret a été commité
quelque part que je n'aurais pas vu. Réécrit l'historique → **force-push + coordination**.

```bash
# Avec git filter-repo (recommandé) — installe : pip install git-filter-repo
cd petanque-app
# Remplace la chaîne secrète partout dans l'historique
git filter-repo --replace-text <(echo 'LE_SECRET==>SUPPRIME')
# Puis, une seule fois, en prévenant tous les collaborateurs :
git push --force-with-lease --all
git push --force-with-lease --tags
```
Ensuite : **révoque/rote** quand même le secret (une fuite passée reste une fuite).

---

## Déjà fait côté code (cette session)
- **Dépendances** : `next 15.4.6 → 15.5.22`, `nodemailer 6 → 9`, `jspdf 3 → 4.2.1`
  (+ `jspdf-autotable 5.0.8`) — CVE critiques/hautes exploitables au runtime corrigées.
  Restent seulement des CVE de **build** (postcss/sharp, entrées internes fiables) et
  `xlsx` (usage écriture seule) → sans impact réel.
- **Revue endpoints comptes joueurs** : auto-liaison limitée aux emails vérifiés,
  liaison de fiche atomique (anti-vol concurrent), rate-limit espace joueur.
- **En-têtes de sécurité** (déjà en place) : CSP, HSTS, X-Frame DENY, nosniff, Referrer-Policy.
- **Aucun secret dans le code source actuel** (vérifié).

## Checklist avant ouverture publique
- [ ] §1 Rotation mot de passe DB faite + app redémarrée + connexion OK
- [ ] §2 `JWT_SECRET` fort et unique en prod
- [ ] `NODE_ENV=production` en prod (cookies `secure`, pas de logs SQL)
- [ ] Sauvegarde base de données récente testée
- [ ] `ADMIN_EMAILS` limité aux vrais admins

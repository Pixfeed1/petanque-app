# 🚀 DÉPLOIEMENT SUR VPS (petanquepro.fr)

## ⚠️ IMPORTANT
Next.js N'EST PAS un site statique ! C'est une application Node.js qui doit tourner comme un serveur.

---

## 📋 PRÉREQUIS SERVEUR

Votre hébergeur doit supporter :
- ✅ **SSH** (accès terminal)
- ✅ **Node.js 18+**
- ✅ **PostgreSQL**
- ✅ **Nginx** ou **Apache** (reverse proxy)

### Vérifier votre hébergement

Connectez-vous en SSH à votre serveur :
```bash
ssh votre_user@petanquepro.fr
```

Vérifiez Node.js :
```bash
node -v   # Doit afficher v18.x ou plus
npm -v    # Doit afficher 9.x ou plus
```

Si Node.js n'est pas installé :
```bash
# Sur Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier
node -v
```

---

## 📦 ÉTAPE 1 : INSTALLER L'APPLICATION

```bash
# Se positionner dans le dossier web
cd /var/www/petanquepro.fr
# OU selon votre hébergeur : cd ~/public_html

# Cloner ou uploader l'application
# Option A : Git (RECOMMANDÉ)
git clone https://github.com/votre-repo/petanque-app.git .

# Option B : Upload manuel
# Uploadez tout le dossier via SFTP, puis :
# unzip petanque-app.zip
# cd petanque-app

# Installer les dépendances
npm install
```

---

## 🗄️ ÉTAPE 2 : CONFIGURER POSTGRESQL

```bash
# Créer la base de données
sudo -u postgres psql

# Dans psql :
CREATE DATABASE petanque_app;
CREATE USER petanque_user WITH PASSWORD 'VotreMotDePasseSecure123!';
GRANT ALL PRIVILEGES ON DATABASE petanque_app TO petanque_user;
\q

# Importer le schéma
psql -U petanque_user -d petanque_app -f database/schema.sql
```

---

## ⚙️ ÉTAPE 3 : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

Créez le fichier `.env.local` :

```bash
nano .env.local
```

Contenu :
```env
# PostgreSQL
DATABASE_URL=postgresql://petanque_user:VotreMotDePasseSecure123!@localhost:5432/petanque_app

# JWT Secret (générez un secret aléatoire)
JWT_SECRET=votre_secret_jwt_minimum_32_caracteres_tres_secure

# Application
NEXT_PUBLIC_APP_URL=https://petanquepro.fr

# Stripe (optionnel - uniquement si vous vendez la version premium)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**Pour générer un JWT_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🏗️ ÉTAPE 4 : BUILD L'APPLICATION

```bash
# Build de production
npm run build

# Tester en local d'abord
npm start
```

L'application devrait démarrer sur `http://localhost:3000`

**Testez** : Ouvrez un autre terminal et faites :
```bash
curl http://localhost:3000
```

Si ça fonctionne, continuez. Sinon, vérifiez les erreurs.

---

## 🔄 ÉTAPE 5 : CONFIGURER PM2 (Process Manager)

PM2 garde l'application en vie même après un redémarrage serveur.

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Lancer l'application avec PM2
pm2 start npm --name "petanque-app" -- start

# Vérifier que ça tourne
pm2 list
pm2 logs petanque-app

# Sauvegarder la config PM2
pm2 save

# Démarrage automatique au boot
pm2 startup
# IMPORTANT : Copiez et exécutez la commande affichée !
```

---

## 🌐 ÉTAPE 6 : CONFIGURER NGINX (Reverse Proxy)

Next.js tourne sur le port **3000**. Nginx doit rediriger le port **80/443** vers **3000**.

### A. Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/petanquepro.fr
```

Contenu :
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name petanquepro.fr www.petanquepro.fr;

    # Logs
    access_log /var/log/nginx/petanquepro.fr.access.log;
    error_log /var/log/nginx/petanquepro.fr.error.log;

    # Proxy vers Next.js (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### B. Activer la configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/petanquepro.fr /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Si OK, recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 ÉTAPE 7 : ACTIVER HTTPS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d petanquepro.fr -d www.petanquepro.fr

# Renouvellement automatique
sudo certbot renew --dry-run
```

Certbot modifiera automatiquement votre config Nginx pour HTTPS !

---

## ✅ ÉTAPE 8 : TESTER

Allez sur **https://petanquepro.fr**

Vous devriez voir la landing page de l'application !

**Créez un compte** pour tester :
1. Cliquez sur "Commencer"
2. Inscrivez-vous avec email/password
3. Vous devriez arriver sur le dashboard

---

## 🔍 DÉPANNAGE

### Erreur 502 Bad Gateway
```bash
# Vérifier que PM2 tourne
pm2 list
pm2 logs petanque-app

# Redémarrer si besoin
pm2 restart petanque-app
```

### Erreur de connexion base de données
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier la connexion
psql -U petanque_user -d petanque_app -c "SELECT 1;"

# Vérifier .env.local
cat .env.local
```

### Voir les logs
```bash
# Logs Next.js
pm2 logs petanque-app

# Logs Nginx
sudo tail -f /var/log/nginx/petanquepro.fr.error.log
```

---

## 🔄 MISE À JOUR DE L'APPLICATION

```bash
# Aller dans le dossier
cd /var/www/petanquepro.fr

# Pull les dernières modifs
git pull origin main

# Installer nouvelles dépendances si besoin
npm install

# Rebuild
npm run build

# Redémarrer PM2
pm2 restart petanque-app
```

---

## 📊 MONITORING

```bash
# Voir les processus
pm2 list

# Voir les ressources
pm2 monit

# Voir les logs en temps réel
pm2 logs petanque-app --lines 100
```

---

## 🎯 CHECKLIST FINALE

- [ ] Node.js 18+ installé
- [ ] PostgreSQL configuré et base créée
- [ ] `.env.local` créé avec DATABASE_URL et JWT_SECRET
- [ ] `npm install` exécuté
- [ ] `npm run build` réussi sans erreurs
- [ ] PM2 lance l'app sur port 3000
- [ ] Nginx redirige port 80 vers 3000
- [ ] HTTPS activé avec Certbot
- [ ] Compte créé et dashboard accessible
- [ ] Création d'un tournoi fonctionne

---

## ⚠️ SI VOTRE HÉBERGEUR NE SUPPORTE PAS NODE.JS

Certains hébergeurs mutualisés (comme OVH mutualisé basique) **ne supportent pas Node.js**.

Dans ce cas, vous avez 3 options :

### Option 1 : VPS ou Serveur Dédié (RECOMMANDÉ)
- ✅ Contrôle total
- ✅ Node.js + PostgreSQL
- 💰 À partir de 5€/mois (OVH VPS, Hetzner, DigitalOcean)

### Option 2 : Hébergement Node.js spécialisé
- Vercel (gratuit pour usage personnel)
- Railway
- Render
- DigitalOcean App Platform

### Option 3 : Export statique (LIMITÉ)
Next.js peut être exporté en statique MAIS :
- ❌ Pas d'API routes (pas d'auth, pas de CRUD)
- ❌ Pas de SSR
- ❌ Votre app ne fonctionnera PAS correctement
- ❌ **NON RECOMMANDÉ pour cette application**

---

## 📞 BESOIN D'AIDE ?

**Vérifiez d'abord :**
1. Les logs PM2 : `pm2 logs petanque-app`
2. Les logs Nginx : `sudo tail -f /var/log/nginx/petanquepro.fr.error.log`
3. Que PostgreSQL tourne : `sudo systemctl status postgresql`

**Si ça ne marche toujours pas, donnez-moi :**
- Le résultat de `pm2 list`
- Les dernières lignes de `pm2 logs petanque-app`
- Le contenu de votre config Nginx

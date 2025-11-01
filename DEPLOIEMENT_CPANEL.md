# 🚀 DÉPLOIEMENT NEXT.JS SUR CPANEL

## 📋 MÉTHODE 1 : Node.js App (cPanel moderne)

### Étape 1 : Vérifier si "Setup Node.js App" existe

1. Connectez-vous à **cPanel**
2. Cherchez dans la section **SOFTWARE** → **Setup Node.js App**
3. **Si vous le trouvez** → Continuez ci-dessous
4. **Si vous ne le trouvez PAS** → Passez à la Méthode 2 (SSH)

---

### Étape 2 : Créer l'application Node.js

Dans **Setup Node.js App** :

1. **Cliquez "Create Application"**

2. Remplissez :
   - **Node.js version** : 18.x ou 20.x (la plus récente)
   - **Application mode** : Production
   - **Application root** : `petanque-app` (ou le nom que vous voulez)
   - **Application URL** : `petanquepro.fr` (votre domaine)
   - **Application startup file** : `server.js`

3. **Cliquez "Create"**

---

### Étape 3 : Uploader les fichiers

**Via File Manager ou FTP** :

1. Allez dans le dossier créé (ex: `/home/votre_user/petanque-app`)
2. **Uploadez TOUS les fichiers** de votre application :
   - `app/`
   - `public/`
   - `database/`
   - `lib/`
   - `package.json`
   - `next.config.js`
   - `tsconfig.json`
   - Etc.

**⚠️ NE PAS uploader** :
   - `node_modules/` (trop lourd)
   - `.next/` (sera créé au build)
   - `.git/`

---

### Étape 4 : Créer server.js

Dans cPanel File Manager, créez un fichier `server.js` à la racine :

```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

---

### Étape 5 : Configurer .env.local

Via File Manager, créez `.env.local` :

```env
DATABASE_URL=postgresql://petanque_user:VOTRE_MDP@localhost:5432/petanque_app
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
NODE_ENV=production
```

---

### Étape 6 : Installer les dépendances

Retournez dans **Setup Node.js App** :

1. Cliquez sur votre application
2. Dans la section **NPM install** → Cliquez "Run NPM Install"
3. **Attendez** (peut prendre 5-10 min)

---

### Étape 7 : Build l'application

Dans le **Terminal** de cPanel (ou SSH) :

```bash
cd /home/votre_user/petanque-app
npm run build
```

---

### Étape 8 : Démarrer l'application

Retournez dans **Setup Node.js App** :

1. Cliquez sur votre application
2. Cliquez **"Restart"** ou **"Start Application"**

---

### Étape 9 : Configurer le domaine

Dans **cPanel → Domains** :

1. Assurez-vous que `petanquepro.fr` pointe vers le bon dossier
2. L'application Node.js devrait automatiquement se servir via le proxy

---

## 📋 MÉTHODE 2 : SSH + PM2 (Si pas de Node.js App dans cPanel)

### Étape 1 : Se connecter en SSH

```bash
ssh votre_user@petanquepro.fr
# Entrez votre mot de passe
```

---

### Étape 2 : Vérifier/Installer Node.js

```bash
# Vérifier
node -v

# Si pas installé ou version < 18
# Utiliser NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node -v  # Doit afficher v18.x
```

---

### Étape 3 : Créer la base PostgreSQL

Dans **cPanel → PostgreSQL Database Wizard** :

1. Créez une base : `petanque_app`
2. Créez un utilisateur : `petanque_user`
3. Donnez tous les privilèges
4. Notez le mot de passe !

Puis en SSH :

```bash
# Se connecter à PostgreSQL
psql -h localhost -U petanque_user -d petanque_app

# Si ça demande le mot de passe et se connecte → OK
# Importez le schéma :
\i /home/votre_user/petanque-app/database/schema.sql
\q
```

---

### Étape 4 : Uploader et installer l'app

```bash
# Aller dans le dossier web
cd ~/public_html
# OU
cd ~/domains/petanquepro.fr/public_html

# Option A : Git (si disponible)
git clone https://github.com/votre-repo/petanque-app.git .

# Option B : Upload via SFTP puis :
# unzip petanque-app.zip
# cd petanque-app

# Installer les dépendances
npm install

# Créer .env.local
nano .env.local
```

Contenu de `.env.local` :
```env
DATABASE_URL=postgresql://petanque_user:VOTRE_MDP@localhost:5432/petanque_app
JWT_SECRET=votre_secret_jwt_32_caracteres
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
NODE_ENV=production
```

```bash
# Sauvegarder : Ctrl+X, Y, Enter
```

---

### Étape 5 : Build

```bash
npm run build
```

Si erreur de mémoire :
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

### Étape 6 : Lancer avec PM2

```bash
# Installer PM2
npm install -g pm2

# Lancer l'app
pm2 start npm --name "petanque" -- start

# Vérifier
pm2 list
pm2 logs petanque

# Sauvegarder pour auto-restart
pm2 save
pm2 startup
# IMPORTANT : Copiez et exécutez la commande affichée
```

---

### Étape 7 : Configurer le proxy dans cPanel

**Option A : Via .htaccess** (plus simple)

Dans le dossier `public_html` de votre domaine, créez `.htaccess` :

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Option B : Via Apache Virtual Host** (plus propre)

En SSH (nécessite sudo) :

```bash
sudo nano /etc/apache2/sites-available/petanquepro.fr.conf
```

```apache
<VirtualHost *:80>
    ServerName petanquepro.fr
    ServerAlias www.petanquepro.fr

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog ${APACHE_LOG_DIR}/petanquepro-error.log
    CustomLog ${APACHE_LOG_DIR}/petanquepro-access.log combined
</VirtualHost>
```

```bash
# Activer les modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2ensite petanquepro.fr
sudo systemctl restart apache2
```

---

### Étape 8 : SSL (HTTPS)

Dans **cPanel → SSL/TLS Status** :

1. Sélectionnez `petanquepro.fr`
2. Cliquez "Run AutoSSL"

OU en SSH :

```bash
sudo certbot --apache -d petanquepro.fr -d www.petanquepro.fr
```

---

## ✅ VÉRIFICATION

Allez sur https://petanquepro.fr

Vous devriez voir la landing page !

---

## 🔍 DÉPANNAGE

### L'app ne démarre pas

```bash
# Voir les logs
pm2 logs petanque

# Redémarrer
pm2 restart petanque

# Vérifier que le port 3000 écoute
netstat -tuln | grep 3000
```

### Erreur 502 Bad Gateway

```bash
# L'app tourne-t-elle ?
pm2 list

# Apache/Nginx redirige-t-il bien ?
curl http://localhost:3000
```

### Erreur base de données

```bash
# Tester la connexion
psql -h localhost -U petanque_user -d petanque_app -c "SELECT 1;"

# Vérifier .env.local
cat .env.local
```

---

## 📊 COMMANDES UTILES

```bash
# Voir les processus PM2
pm2 list

# Voir les logs en temps réel
pm2 logs petanque

# Redémarrer après modif
pm2 restart petanque

# Arrêter
pm2 stop petanque

# Supprimer
pm2 delete petanque
```

---

## 🔄 MISE À JOUR

```bash
cd ~/public_html/petanque-app
git pull
npm install
npm run build
pm2 restart petanque
```

---

## ⚠️ IMPORTANT

1. **Ne supprimez PAS** le dossier `public_html` existant
2. **L'app Next.js** doit tourner avec PM2 sur port 3000
3. **Apache/Nginx** doit faire un reverse proxy vers ce port
4. **.htaccess** doit rediriger vers localhost:3000

---

Voilà ! Suivez ces étapes et ça va marcher. 🚀

# 🎯 Migration Supabase → PostgreSQL Natif

## ✅ Ce qui a été fait

Cette application a été **complètement migrée** de Supabase vers PostgreSQL natif. Vous pouvez maintenant déployer votre propre base de données PostgreSQL sur votre VPS.

### Changements majeurs

1. **✅ Authentification JWT custom** - Plus de dépendance à Supabase Auth
2. **✅ API REST complète** - Backend Node.js avec Express-like routing
3. **✅ Base PostgreSQL native** - Connection via le package `pg`
4. **✅ Sessions sécurisées** - Cookies HTTP-only avec tokens JWT
5. **✅ Schéma SQL complet** - Prêt à importer dans votre PostgreSQL

## 🚀 Déploiement sur votre VPS

### Étape 1: Installer PostgreSQL

```bash
# Sur Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Vérifier que PostgreSQL fonctionne
sudo systemctl status postgresql
```

### Étape 2: Créer la base de données

```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Dans le shell PostgreSQL :
CREATE DATABASE petanque;
CREATE USER petanque_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE petanque TO petanque_user;

# Quitter
\q
```

### Étape 3: Importer le schéma

```bash
# Depuis le dossier de l'application
sudo -u postgres psql petanque < database/schema_nouid.sql

# Vérifier que les tables ont été créées
sudo -u postgres psql petanque -c "\dt"
```

### Étape 4: Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer avec vos vraies valeurs
nano .env.local
```

Remplissez au minimum :

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=petanque
POSTGRES_USER=petanque_user
POSTGRES_PASSWORD=votre_mot_de_passe_securise

# Générez une clé secrète JWT
JWT_SECRET=$(openssl rand -base64 32)
```

### Étape 5: Installer les dépendances et builder

```bash
# Installer les packages
npm install

# Builder l'application
npm run build
```

### Étape 6: Lancer l'application

#### Option A: Avec PM2 (recommandé en production)

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start npm --name "petanque-app" -- start

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

#### Option B: Avec systemd

Créez le fichier `/etc/systemd/system/petanque.service` :

```ini
[Unit]
Description=Petanque App
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/petanque-app
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ensuite :

```bash
sudo systemctl daemon-reload
sudo systemctl enable petanque
sudo systemctl start petanque
```

### Étape 7: Configurer Nginx comme reverse proxy

Créez `/etc/nginx/sites-available/petanque` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activez et testez :

```bash
sudo ln -s /etc/nginx/sites-available/petanque /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Étape 8: SSL avec Let's Encrypt (optionnel mais recommandé)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## 🔒 Sécurité PostgreSQL

### Configurer l'accès distant (si nécessaire)

Éditez `/etc/postgresql/*/main/postgresql.conf` :

```conf
listen_addresses = 'localhost'  # Ou '*' pour autoriser les connexions distantes
```

Éditez `/etc/postgresql/*/main/pg_hba.conf` :

```conf
# Autoriser les connexions locales avec mot de passe
host    all             all             127.0.0.1/32            md5

# Si vous avez besoin d'accès distant (ATTENTION: sécurisez avec firewall!)
# host    all             all             0.0.0.0/0               md5
```

Redémarrez PostgreSQL :

```bash
sudo systemctl restart postgresql
```

### Sauvegardes automatiques

Créez un script de sauvegarde `/home/user/backup-petanque.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/petanque_$DATE.sql"

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Faire le backup
pg_dump petanque > $BACKUP_FILE

# Compresser
gzip $BACKUP_FILE

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "petanque_*.sql.gz" -mtime +7 -delete

echo "Backup créé: $BACKUP_FILE.gz"
```

Rendez-le exécutable et ajoutez-le au cron :

```bash
chmod +x /home/user/backup-petanque.sh

# Ajouter au crontab (backup quotidien à 2h du matin)
crontab -e
# Ajouter: 0 2 * * * /home/user/backup-petanque.sh
```

## 📊 Monitoring

### Vérifier que PostgreSQL fonctionne

```bash
sudo systemctl status postgresql
```

### Vérifier les connexions actives

```bash
sudo -u postgres psql petanque -c "SELECT count(*) FROM pg_stat_activity;"
```

### Voir les logs PostgreSQL

```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Voir les logs de l'application

```bash
# Si vous utilisez PM2
pm2 logs petanque-app

# Si vous utilisez systemd
sudo journalctl -u petanque -f
```

## 🔧 Dépannage

### Erreur: "Connection refused" PostgreSQL

```bash
# Vérifier que PostgreSQL écoute
sudo netstat -plunt | grep postgres

# Vérifier pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### Erreur: "JWT_SECRET not defined"

Assurez-vous que `.env.local` contient `JWT_SECRET` avec une valeur générée :

```bash
openssl rand -base64 32
```

### Erreur: "Permission denied" sur les tables

```bash
# Donner tous les privilèges à votre utilisateur
sudo -u postgres psql petanque
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO petanque_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO petanque_user;
```

## 📝 Structure des APIs

Toutes les APIs sont disponibles sous `/api` :

- **Auth** : `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`, `/api/auth/logout`
- **Organisations** : `/api/organisations`
- **Tournois** : `/api/tournois`, `/api/tournois/[id]`
- **Joueurs** : `/api/joueurs`
- **Équipes** : `/api/equipes`
- **Matches** : `/api/matches`, `/api/matches/[id]`

## 🎉 C'est terminé !

Votre application tourne maintenant sur **PostgreSQL pur** sans aucune dépendance à Supabase. Vous avez le contrôle total de vos données et de votre infrastructure.

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :

1. Les logs PostgreSQL
2. Les logs de l'application (PM2 ou systemd)
3. Les permissions sur la base de données
4. Les variables d'environnement dans `.env.local`

---

**Bon déploiement ! 🚀**

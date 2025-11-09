# Guide de Déploiement - Pétanque Pro

## Déploiement Automatique

Le script `deploy.sh` automatise complètement le déploiement sur le VPS.

### Utilisation Simple

```bash
# Connexion SSH
ssh root@95.179.218.37 -p2298

# Passer à l'utilisateur cPanel
su - jurojinn

# Aller dans le dossier
cd ~/petanque-app

# Lancer le déploiement
./deploy.sh
```

### Ce que fait le script

1. **Pull Git** - Récupère les dernières modifications
2. **Installation** - `npm install` pour les nouvelles dépendances
3. **Migrations SQL** - Applique automatiquement les migrations
4. **Build** - `npm run build` pour compiler Next.js
5. **Redémarrage** - Relance l'application

### Migrations SQL

Le script track automatiquement les migrations appliquées dans `.migrations_applied`.

**En cas d'échec de psql** : Le script affiche le SQL à copier/coller dans phpMyAdmin.

### Logs

Consulter les logs en temps réel :

```bash
tail -f app.log
```

### Vérifier l'état

```bash
# Voir les processus Node
ps aux | grep "next start"

# Voir les dernières lignes de log
tail -20 app.log
```

### Redémarrage Manuel

Si besoin de redémarrer manuellement :

```bash
# Arrêter
pkill -f "next start"

# Démarrer
nohup npm start > app.log 2>&1 &
```

---

## Configuration Initiale (une seule fois)

### 1. Variables d'environnement

Créer/éditer `.env.local` :

```bash
# Base de données
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=jurojinn_petanque_app
POSTGRES_USER=jurojinn
POSTGRES_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_genere_avec_openssl

# Application
NEXT_PUBLIC_APP_URL=https://petanquepro.fr
NODE_ENV=production

# Email SMTP (optionnel)
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_FROM=noreply@petanquepro.fr
```

Générer un JWT secret :
```bash
openssl rand -base64 32
```

### 2. Base de données

Les migrations sont appliquées automatiquement par `deploy.sh`.

Si besoin de les appliquer manuellement :

```bash
psql -h localhost -d jurojinn_petanque_app -U jurojinn -f database/migrations/003_add_validation_fields.sql
psql -h localhost -d jurojinn_petanque_app -U jurojinn -f database/migrations/004_fix_joueur_ids_type.sql
```

Ou via phpMyAdmin en copiant le contenu des fichiers SQL.

---

## Dépannage

### Build échoue

```bash
# Nettoyer le cache
rm -rf .next
npm run build
```

### L'application ne démarre pas

```bash
# Vérifier les logs
tail -50 app.log

# Vérifier les variables d'environnement
cat .env.local
```

### Migration SQL échoue

Si psql n'est pas accessible, utilisez phpMyAdmin :
1. Connectez-vous à phpMyAdmin
2. Sélectionnez `jurojinn_petanque_app`
3. Onglet SQL
4. Copiez le contenu de `database/migrations/XXX.sql`
5. Exécutez

---

## Sécurité

**IMPORTANT** : Ne jamais commiter :
- `.env.local` (credentials)
- `.migrations_applied` (spécifique au serveur)
- `app.log` (logs du serveur)

Ces fichiers sont dans `.gitignore`.

---

## Support

En cas de problème, vérifiez :
1. Les logs : `tail -f app.log`
2. Les processus : `ps aux | grep node`
3. Le build : `npm run build`
4. Les migrations : fichier `.migrations_applied`

#!/bin/bash
# Script d'installation HTTPS pour petanquepro.fr
# À exécuter sur le serveur VPS avec sudo

set -e

echo "🔒 Installation HTTPS pour petanquepro.fr"
echo "=========================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then
   echo "❌ Ce script doit être exécuté avec sudo"
   exit 1
fi

DOMAIN="petanquepro.fr"
WWW_DOMAIN="www.petanquepro.fr"
APP_DIR="/home/user/petanquepro.fr"

echo "📦 Étape 1/5: Installation de nginx..."
apt update
apt install -y nginx

echo ""
echo "⚙️  Étape 2/5: Configuration nginx..."

# Créer la configuration nginx
cat > /etc/nginx/sites-available/petanquepro.fr << 'NGINX_EOF'
server {
    listen 80;
    server_name petanquepro.fr www.petanquepro.fr;

    # Logs
    access_log /var/log/nginx/petanquepro.fr-access.log;
    error_log /var/log/nginx/petanquepro.fr-error.log;

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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

# Activer le site
ln -sf /etc/nginx/sites-available/petanquepro.fr /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Redémarrer nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "🔐 Étape 3/5: Installation de Certbot..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "📜 Étape 4/5: Obtention du certificat SSL..."
echo "⚠️  Assurez-vous que petanquepro.fr pointe vers ce serveur !"
echo ""

# Obtenir le certificat SSL
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo ""
echo "✅ Étape 5/5: Configuration de l'application..."

# Créer/mettre à jour .env.local
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo "Création de .env.local..."
    cat > "$APP_DIR/.env.local" << 'ENV_EOF'
# URL de production avec HTTPS
NEXT_PUBLIC_APP_URL=https://petanquepro.fr

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=petanque
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ChangeMe

# JWT Secret (à changer!)
JWT_SECRET=ChangeThisToASecureRandomString

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/facebook/callback

# Environnement
NODE_ENV=production
ENV_EOF

    chown jurojinn:jurojinn "$APP_DIR/.env.local"
    echo "⚠️  IMPORTANT: Éditez $APP_DIR/.env.local et mettez vos vraies valeurs !"
else
    echo "✅ .env.local existe déjà"
    # Mettre à jour juste l'URL
    sed -i 's|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://petanquepro.fr|' "$APP_DIR/.env.local"
    sed -i 's|GOOGLE_REDIRECT_URI=.*|GOOGLE_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/google/callback|' "$APP_DIR/.env.local"
    sed -i 's|FACEBOOK_REDIRECT_URI=.*|FACEBOOK_REDIRECT_URI=https://petanquepro.fr/api/auth/oauth/facebook/callback|' "$APP_DIR/.env.local"
fi

echo ""
echo "=========================================="
echo "✅ Installation HTTPS terminée !"
echo "=========================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Éditez le fichier .env.local avec vos vraies valeurs:"
echo "   nano $APP_DIR/.env.local"
echo ""
echo "2. Générez un JWT_SECRET sécurisé:"
echo "   openssl rand -base64 32"
echo ""
echo "3. Dans Google Cloud Console, ajoutez:"
echo "   - URI de redirection: https://petanquepro.fr/api/auth/oauth/google/callback"
echo "   - Origines JavaScript: https://petanquepro.fr"
echo ""
echo "4. Rebuild et relancez l'application:"
echo "   cd $APP_DIR"
echo "   npm run build"
echo "   pkill -f 'next start'"
echo "   nohup npm start > app.log 2>&1 &"
echo ""
echo "5. Testez: https://petanquepro.fr"
echo ""
echo "🔄 Le certificat SSL se renouvellera automatiquement tous les 90 jours."
echo ""

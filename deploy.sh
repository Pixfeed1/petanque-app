#!/bin/bash
# Script de déploiement automatique pour Pétanque Pro
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de Pétanque Pro..."
echo "=================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="jurojinn_petanque_app"
DB_USER="jurojinn_petanque_user"
MIGRATION_TRACKER=".migrations_applied"

# Créer le fichier de tracking si inexistant
if [ ! -f "$MIGRATION_TRACKER" ]; then
    touch "$MIGRATION_TRACKER"
    echo "📝 Fichier de tracking des migrations créé"
fi

# 1. Pull des dernières modifications
echo ""
echo -e "${YELLOW}📥 Récupération des modifications...${NC}"
git pull origin claude/yo-011CV4KFYaToG2qqeC1r68MK

# 2. Installation des dépendances
echo ""
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install

# 3. Application des migrations SQL
echo ""
echo -e "${YELLOW}🗄️  Application des migrations SQL...${NC}"

MIGRATIONS_DIR="database/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    # Trier les migrations par ordre alphabétique
    for migration_file in $(ls -1 $MIGRATIONS_DIR/*.sql 2>/dev/null | sort); do
        migration_name=$(basename "$migration_file")

        # Vérifier si déjà appliquée
        if grep -q "$migration_name" "$MIGRATION_TRACKER"; then
            echo -e "  ⏭️  ${migration_name} (déjà appliquée)"
        else
            echo -e "  ▶️  Application de ${migration_name}..."

            # Tenter d'appliquer la migration
            if psql -h localhost -d "$DB_NAME" -U "$DB_USER" -f "$migration_file" > /dev/null 2>&1; then
                echo "$migration_name" >> "$MIGRATION_TRACKER"
                echo -e "  ${GREEN}✅ ${migration_name} appliquée avec succès${NC}"
            else
                # Si psql échoue, afficher les instructions manuelles
                echo -e "  ${RED}❌ Impossible d'appliquer automatiquement${NC}"
                echo ""
                echo -e "${YELLOW}⚠️  Appliquez manuellement via phpMyAdmin :${NC}"
                echo "     1. Connectez-vous à phpMyAdmin"
                echo "     2. Sélectionnez la base '$DB_NAME'"
                echo "     3. Copiez/collez le contenu de: $migration_file"
                echo "     4. Exécutez le SQL"
                echo ""
                echo "Contenu à copier :"
                echo "===================="
                cat "$migration_file"
                echo "===================="
                echo ""
                read -p "Appuyez sur Entrée après avoir appliqué manuellement..."
                echo "$migration_name" >> "$MIGRATION_TRACKER"
            fi
        fi
    done
else
    echo "  ℹ️  Aucune migration à appliquer"
fi

# 4. Build Next.js
echo ""
echo -e "${YELLOW}🔨 Build de l'application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build échoué !${NC}"
    exit 1
fi

# 5. Redémarrage de l'application
echo ""
echo -e "${YELLOW}🔄 Redémarrage de l'application...${NC}"

# Arrêt propre de l'application
echo "  Arrêt des processus Node en cours..."

# Fonction pour libérer le port 3000
free_port_3000() {
    echo "  Tentative de libération du port 3000..."

    # Tuer TOUS les processus Node (méthode 1: par nom)
    pkill -9 -f "next start" 2>/dev/null || true
    pkill -9 -f "node" 2>/dev/null || true

    # Méthode 2: par port avec fuser
    fuser -k 3000/tcp 2>/dev/null || true

    # Méthode 3: par port avec lsof
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null || true

    # Méthode 4: avec netstat/ss pour trouver les PIDs
    ss -lptn 'sport = :3000' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | xargs -r kill -9 2>/dev/null || true

    # Attendre que les processus soient vraiment tués
    sleep 3

    # Vérifier avec PLUSIEURS outils que le port est libre
    local port_busy=0

    # Check 1: lsof
    if lsof -i:3000 >/dev/null 2>&1; then
        echo "    ⚠️  Port détecté occupé par lsof"
        lsof -i:3000
        port_busy=1
    fi

    # Check 2: netstat/ss
    if ss -ltn 'sport = :3000' 2>/dev/null | grep -q ':3000'; then
        echo "    ⚠️  Port détecté occupé par ss/netstat"
        ss -ltnp 'sport = :3000'
        port_busy=1
    fi

    # Check 3: essai direct avec nc (netcat) si disponible
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost 3000 2>/dev/null; then
            echo "    ⚠️  Port détecté occupé par nc"
            port_busy=1
        fi
    fi

    return $port_busy
}

# Essayer de libérer le port (max 3 tentatives)
attempt=1
max_attempts=3

while [ $attempt -le $max_attempts ]; do
    if free_port_3000; then
        echo -e "  ${GREEN}✅ Port 3000 libéré (tentative $attempt/$max_attempts)${NC}"
        break
    else
        echo -e "  ${YELLOW}⚠️  Port 3000 encore occupé, nouvelle tentative...${NC}"
        attempt=$((attempt + 1))

        if [ $attempt -le $max_attempts ]; then
            sleep 2
        else
            echo -e "  ${RED}❌ Impossible de libérer le port 3000 après $max_attempts tentatives${NC}"
            echo ""
            echo "Processus encore actifs sur le port 3000 :"
            lsof -i:3000 || echo "Aucun trouvé avec lsof"
            echo ""
            echo "Pour débloquer manuellement :"
            echo "  sudo lsof -ti:3000 | xargs sudo kill -9"
            exit 1
        fi
    fi
done

# Relancer l'application
echo ""
echo -e "${GREEN}=================================="
echo "✅ Déploiement terminé avec succès !"
echo "==================================${NC}"
echo ""

# Vérification finale avant démarrage
echo "🔍 Vérification finale du port 3000..."
if lsof -i:3000 >/dev/null 2>&1 || ss -ltn 'sport = :3000' 2>/dev/null | grep -q ':3000'; then
    echo -e "${RED}⚠️  ATTENTION: Le port 3000 semble encore occupé !${NC}"
    echo ""
    echo "Processus détectés :"
    lsof -i:3000 2>/dev/null || true
    ss -ltnp 'sport = :3000' 2>/dev/null || true
    echo ""
    echo -e "${YELLOW}Tentative de démarrage quand même...${NC}"
else
    echo -e "${GREEN}✅ Port 3000 est libre${NC}"
fi

echo ""
echo "🚀 Démarrage de l'application..."
echo "📝 Logs en direct (CTRL+C pour arrêter) :"
echo ""

# Lancer npm start en direct (pas en background)
npm start

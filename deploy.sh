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

# Utiliser le script de nettoyage dédié
if [ -f "./kill-port-3000.sh" ]; then
    ./kill-port-3000.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ Impossible de libérer le port 3000${NC}"
        echo "Lancez manuellement: ./kill-port-3000.sh"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  kill-port-3000.sh introuvable, nettoyage basique...${NC}"
    pkill -9 node 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 3
fi

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

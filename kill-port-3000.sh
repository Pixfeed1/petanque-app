#!/bin/bash

# Script pour tuer TOUS les processus sur le port 3000

echo "🔪 Nettoyage du port 3000..."
echo ""

# Méthode 1: pkill sur tous les processus node
echo "1️⃣  Killing processus Node..."
pkill -9 -f "next start" 2>/dev/null && echo "   ✓ next start tué" || echo "   - aucun next start"
pkill -9 -f "node.*3000" 2>/dev/null && echo "   ✓ node sur 3000 tué" || echo "   - aucun node sur 3000"
pkill -9 node 2>/dev/null && echo "   ✓ tous les node tués" || echo "   - aucun node"

echo ""
echo "2️⃣  Killing via fuser..."
fuser -k 3000/tcp 2>/dev/null && echo "   ✓ Processus tué via fuser" || echo "   - rien trouvé par fuser"

echo ""
echo "3️⃣  Killing via lsof..."
PIDS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PIDS" ]; then
    echo "   PIDs trouvés: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null && echo "   ✓ Tués via lsof" || echo "   ✗ Échec kill"
else
    echo "   - rien trouvé par lsof"
fi

echo ""
echo "4️⃣  Killing via ss/netstat..."
PIDS=$(ss -lptn 'sport = :3000' 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u)
if [ -n "$PIDS" ]; then
    echo "   PIDs trouvés: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null && echo "   ✓ Tués via ss" || echo "   ✗ Échec kill"
else
    echo "   - rien trouvé par ss"
fi

echo ""
echo "⏳ Attente 3 secondes..."
sleep 3

echo ""
echo "🔍 Vérification finale..."

# Vérification avec lsof
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port ENCORE occupé (lsof):"
    lsof -i:3000
    echo ""
    echo "Processus récalcitrants - essayez manuellement:"
    lsof -i:3000 | tail -n +2 | awk '{print "  kill -9 " $2}'
    exit 1
fi

# Vérification avec ss
if ss -ltn 'sport = :3000' 2>/dev/null | grep -q ':3000'; then
    echo "❌ Port ENCORE occupé (ss):"
    ss -ltnp 'sport = :3000'
    exit 1
fi

echo "✅ Port 3000 est LIBRE !"
exit 0

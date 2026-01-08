#!/bin/bash

# Script d'arrêt Docker pour le projet Gestion Garage Mécanique

echo "🛑 Arrêt de l'application Gestion Garage Mécanique..."
echo ""

docker-compose down

echo ""
echo "✅ Tous les conteneurs ont été arrêtés."
echo ""
echo "💡 Pour supprimer aussi les volumes (données) : docker-compose down -v"
echo ""


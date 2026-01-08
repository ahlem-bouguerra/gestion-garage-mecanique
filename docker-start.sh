#!/bin/bash

# Script de démarrage Docker pour le projet Gestion Garage Mécanique

echo "🚀 Démarrage de l'application Gestion Garage Mécanique..."
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier si le fichier .env existe dans Back-End
if [ ! -f "Back-End/.env" ]; then
    echo "⚠️  Fichier Back-End/.env non trouvé. Création à partir de l'exemple..."
    if [ -f "Back-End/.env.example" ]; then
        cp Back-End/.env.example Back-End/.env
        echo "✅ Fichier .env créé. Veuillez le configurer avec vos valeurs."
    else
        echo "❌ Fichier .env.example non trouvé."
    fi
fi

echo ""
echo "📦 Construction des images Docker..."
docker-compose build

echo ""
echo "🎬 Démarrage des conteneurs..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

echo ""
echo "✅ Application démarrée avec succès !"
echo ""
echo "📍 Accès aux services :"
echo "   - Interface Admin  : http://localhost:3000"
echo "   - Interface Client : http://localhost:3001"
echo "   - API Backend      : http://localhost:5000"
echo "   - MongoDB          : mongodb://localhost:27017"
echo ""
echo "📊 Pour voir les logs : docker-compose logs -f"
echo "🛑 Pour arrêter       : docker-compose down"
echo ""


#!/bin/bash

# Script de vérification de l'installation Docker

echo "🔍 Vérification de l'environnement Docker..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur d'erreurs
ERRORS=0

# Vérifier Docker
echo -n "Vérification de Docker... "
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker n'est pas installé"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier Docker Compose
echo -n "Vérification de Docker Compose... "
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose n'est pas installé"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier que Docker est en cours d'exécution
echo -n "Vérification du daemon Docker... "
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon est en cours d'exécution"
else
    echo -e "${RED}✗${NC} Docker daemon n'est pas en cours d'exécution"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier les fichiers Docker
echo ""
echo "Vérification des fichiers de configuration Docker..."

FILES=(
    "docker-compose.yml"
    "Back-End/Dockerfile"
    "Front-End/Dockerfile"
    "Front-End-Client/Dockerfile"
    "env.example"
)

for file in "${FILES[@]}"; do
    echo -n "  - $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Vérifier le fichier .env
echo ""
echo -n "Vérification du fichier .env... "
if [ -f ".env" ] || [ -f "Back-End/.env" ]; then
    echo -e "${GREEN}✓${NC} Fichier .env trouvé"
else
    echo -e "${YELLOW}⚠${NC}  Fichier .env non trouvé (utilisez 'cp env.example .env')"
fi

# Vérifier les ports disponibles
echo ""
echo "Vérification de la disponibilité des ports..."

PORTS=(3000 3001 5000 27017)
for port in "${PORTS[@]}"; do
    echo -n "  - Port $port... "
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC}  En cours d'utilisation"
    else
        echo -e "${GREEN}✓${NC} Disponible"
    fi
done

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Tout est prêt ! Vous pouvez démarrer l'application.${NC}"
    echo ""
    echo "Commandes pour démarrer :"
    echo "  make build && make up"
    echo "  ou"
    echo "  docker-compose up --build"
else
    echo -e "${RED}✗ $ERRORS erreur(s) détectée(s). Veuillez corriger avant de continuer.${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""


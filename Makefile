.PHONY: help build up down restart logs clean

# Couleurs pour les messages
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Affiche ce message d'aide
	@echo "$(GREEN)═══════════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Gestion Garage Mécanique - Commandes Docker disponibles$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════════════════$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

build: ## Construire les images Docker
	@echo "$(GREEN)📦 Construction des images Docker...$(NC)"
	docker-compose build

up: ## Démarrer tous les services
	@echo "$(GREEN)🚀 Démarrage de tous les services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@echo ""
	@echo "  📍 Interface Admin  : http://localhost:3000"
	@echo "  📍 Interface Client : http://localhost:3001"
	@echo "  📍 API Backend      : http://localhost:5000"
	@echo "  📍 MongoDB          : mongodb://localhost:27017"
	@echo ""

down: ## Arrêter tous les services
	@echo "$(YELLOW)🛑 Arrêt de tous les services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services arrêtés !$(NC)"

restart: down up ## Redémarrer tous les services

logs: ## Afficher les logs de tous les services
	docker-compose logs -f

logs-backend: ## Afficher les logs du backend uniquement
	docker-compose logs -f backend

logs-admin: ## Afficher les logs du frontend admin
	docker-compose logs -f frontend-admin

logs-client: ## Afficher les logs du frontend client
	docker-compose logs -f frontend-client

logs-db: ## Afficher les logs de MongoDB
	docker-compose logs -f mongodb

ps: ## Afficher l'état des conteneurs
	docker-compose ps

clean: ## Nettoyer les conteneurs, images et volumes
	@echo "$(YELLOW)🧹 Nettoyage complet (conteneurs, images, volumes)...$(NC)"
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé !$(NC)"

dev: ## Démarrer en mode développement avec logs
	@echo "$(GREEN)🚀 Démarrage en mode développement...$(NC)"
	docker-compose up --build

shell-backend: ## Accéder au shell du conteneur backend
	docker-compose exec backend sh

shell-admin: ## Accéder au shell du conteneur frontend admin
	docker-compose exec frontend-admin sh

shell-client: ## Accéder au shell du conteneur frontend client
	docker-compose exec frontend-client sh

shell-db: ## Accéder au shell MongoDB
	docker-compose exec mongodb mongosh -u admin -p admin123

backup-db: ## Sauvegarder la base de données
	@echo "$(GREEN)💾 Sauvegarde de la base de données...$(NC)"
	@mkdir -p ./backups
	docker-compose exec mongodb mongodump --username admin --password admin123 --authenticationDatabase admin --out /tmp/backup
	docker cp garage-mongodb:/tmp/backup ./backups/backup-$$(date +%Y%m%d-%H%M%S)
	@echo "$(GREEN)✅ Sauvegarde terminée !$(NC)"

install: ## Installation initiale (première fois)
	@echo "$(GREEN)📥 Installation du projet...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠️  Création du fichier .env...$(NC)"; \
		cp env.example .env; \
		echo "$(GREEN)✅ Fichier .env créé ! Configurez-le avant de continuer.$(NC)"; \
	fi
	@echo "$(GREEN)✅ Installation terminée !$(NC)"
	@echo ""
	@echo "$(YELLOW)Prochaines étapes :$(NC)"
	@echo "  1. Configurez le fichier .env"
	@echo "  2. Exécutez: make build"
	@echo "  3. Exécutez: make up"


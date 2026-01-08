# 🐳 Guide Docker - Gestion Garage Mécanique

Ce guide explique comment démarrer et gérer l'application avec Docker.

## 📋 Prérequis

- Docker (version 20.10 ou supérieure)
- Docker Compose (version 2.0 ou supérieure)

## 🏗️ Architecture

L'application est composée de 4 services Docker :

1. **mongodb** : Base de données MongoDB (port 27017)
2. **backend** : API Express.js (port 5000)
3. **frontend-admin** : Interface d'administration Next.js (port 3000)
4. **frontend-client** : Interface client Next.js (port 3001)

## 🚀 Démarrage rapide

### 1. Configurer les variables d'environnement

Copiez le fichier `.env.example` et créez un fichier `.env` à la racine du projet :

```bash
cp Back-End/.env.example Back-End/.env
```

Modifiez les valeurs dans le fichier `.env` selon vos besoins.

### 2. Construire et démarrer tous les services

```bash
docker-compose up --build
```

Ou en mode détaché (en arrière-plan) :

```bash
docker-compose up --build -d
```

### 3. Accéder aux applications

- **Interface Admin** : http://localhost:3000
- **Interface Client** : http://localhost:3001
- **API Backend** : http://localhost:5000
- **MongoDB** : mongodb://localhost:27017

## 🛠️ Commandes utiles

### Démarrer les services (sans rebuild)
```bash
docker-compose up
```

### Arrêter les services
```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ supprime les données)
```bash
docker-compose down -v
```

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend-admin
docker-compose logs -f frontend-client
docker-compose logs -f mongodb
```

### Reconstruire un service spécifique
```bash
docker-compose build backend
docker-compose build frontend-admin
docker-compose build frontend-client
```

### Redémarrer un service
```bash
docker-compose restart backend
docker-compose restart frontend-admin
docker-compose restart frontend-client
```

### Exécuter une commande dans un conteneur
```bash
# Accéder au shell du backend
docker-compose exec backend sh

# Accéder au shell MongoDB
docker-compose exec mongodb mongosh -u admin -p admin123
```

### Voir l'état des conteneurs
```bash
docker-compose ps
```

## 🔧 Configuration

### Variables d'environnement principales

Vous pouvez créer un fichier `.env` à la racine du projet pour personnaliser :

```env
# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=admin123
MONGO_URI=mongodb://admin:admin123@mongodb:27017/garage?authSource=admin

# Backend
SESSION_SECRET=votre_secret_session
JWT_SECRET=votre_secret_jwt
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
EMAIL_USER=votre_email@example.com
EMAIL_PASSWORD=votre_mot_de_passe

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Ports personnalisés

Pour modifier les ports, éditez le fichier `docker-compose.yml` :

```yaml
services:
  backend:
    ports:
      - "NOUVEAU_PORT:5000"
```

## 🗄️ Gestion de la base de données

### Sauvegarder la base de données

```bash
docker-compose exec mongodb mongodump --username admin --password admin123 --authenticationDatabase admin --out /tmp/backup
docker cp garage-mongodb:/tmp/backup ./backup-$(date +%Y%m%d)
```

### Restaurer la base de données

```bash
docker cp ./backup-YYYYMMDD garage-mongodb:/tmp/backup
docker-compose exec mongodb mongorestore --username admin --password admin123 --authenticationDatabase admin /tmp/backup
```

## 🐛 Dépannage

### Problème de port déjà utilisé

Si un port est déjà utilisé, arrêtez le service existant ou modifiez les ports dans `docker-compose.yml`.

### Les services ne communiquent pas

Assurez-vous que tous les services sont sur le même réseau Docker (`garage-network`).

### Problèmes de build

Nettoyez les images et reconstruisez :

```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

### Erreur de connexion MongoDB

Vérifiez que les credentials MongoDB correspondent entre les services et l'URI de connexion.

## 📦 Production

Pour déployer en production :

1. Changez `NODE_ENV=production` dans les variables d'environnement
2. Utilisez des secrets sécurisés (pas les valeurs par défaut)
3. Configurez un reverse proxy (nginx) devant les services
4. Activez HTTPS
5. Configurez des sauvegardes automatiques de MongoDB
6. Limitez l'accès au port MongoDB (ne pas l'exposer publiquement)

## 🔒 Sécurité

- ⚠️ **Ne jamais** committer le fichier `.env` avec des vraies credentials
- Changez tous les mots de passe par défaut avant le déploiement
- Utilisez des secrets Docker pour les informations sensibles en production
- Activez l'authentification et le chiffrement pour MongoDB

## 📝 Notes

- Les données MongoDB sont persistées dans un volume Docker (`mongodb_data`)
- Les conteneurs redémarrent automatiquement en cas d'échec (`restart: unless-stopped`)
- Le backend attend que MongoDB soit disponible avant de démarrer (`depends_on`)


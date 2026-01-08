# 🚀 Démarrage Rapide avec Docker

Ce guide vous permet de démarrer l'application en quelques minutes avec Docker.

## 📋 Prérequis

Assurez-vous d'avoir installé :
- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

## ⚡ Installation en 3 étapes

### Étape 1 : Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

**Au minimum, modifiez :**
- `SESSION_SECRET` : Un secret pour les sessions
- `JWT_SECRET` : Un secret pour les tokens JWT
- `MONGO_PASSWORD` : Le mot de passe MongoDB

### Étape 2 : Construire les images

```bash
make build
# ou
docker-compose build
```

### Étape 3 : Démarrer l'application

```bash
make up
# ou
docker-compose up -d
```

## 🎉 C'est fait !

Votre application est maintenant accessible :

| Service | URL | Description |
|---------|-----|-------------|
| 👨‍💼 **Interface Admin** | http://localhost:3000 | Interface d'administration du garage |
| 👤 **Interface Client** | http://localhost:3001 | Interface pour les clients |
| 🔌 **API Backend** | http://localhost:5000 | API REST |
| 🗄️ **MongoDB** | mongodb://localhost:27017 | Base de données |

## 📝 Commandes utiles

### Avec Make (recommandé)

```bash
make help          # Afficher toutes les commandes disponibles
make up            # Démarrer tous les services
make down          # Arrêter tous les services
make logs          # Voir les logs en temps réel
make restart       # Redémarrer tous les services
make ps            # Voir l'état des conteneurs
make clean         # Nettoyer complètement (⚠️ supprime les données)
```

### Avec Docker Compose

```bash
docker-compose up -d              # Démarrer en arrière-plan
docker-compose down               # Arrêter
docker-compose logs -f            # Voir les logs
docker-compose ps                 # État des conteneurs
docker-compose restart backend    # Redémarrer un service
```

## 🔍 Vérifier que tout fonctionne

### 1. Vérifier l'état des conteneurs

```bash
make ps
# ou
docker-compose ps
```

Tous les services devraient avoir le statut "Up".

### 2. Vérifier les logs

```bash
make logs
# ou
docker-compose logs -f
```

Vous devriez voir :
- ✅ "MongoDB connecté" (backend)
- ✅ "Serveur lancé sur http://localhost:5000" (backend)
- ✅ Les frontends démarrent sans erreur

### 3. Tester l'API

```bash
curl http://localhost:5000
# Réponse attendue : "API opérationnelle !"
```

## 🐛 Problèmes courants

### Port déjà utilisé

Si vous voyez `port is already allocated` :

```bash
# Trouver le processus qui utilise le port (exemple pour le port 5000)
lsof -i :5000

# Arrêter le processus ou changer le port dans docker-compose.yml
```

### Les services ne démarrent pas

```bash
# Voir les logs détaillés
make logs

# Reconstruire sans cache
docker-compose build --no-cache
```

### Problème de connexion MongoDB

```bash
# Vérifier que MongoDB est bien démarré
docker-compose logs mongodb

# Se connecter à MongoDB pour tester
make shell-db
```

### Nettoyer et recommencer

```bash
# Arrêter et supprimer tout (⚠️ perte de données)
make clean

# Reconstruire
make build

# Redémarrer
make up
```

## 📚 Documentation complète

Pour plus de détails, consultez :
- [DOCKER.md](./DOCKER.md) - Guide Docker complet
- [README.md](./README.md) - Documentation du projet

## 💡 Conseils

### Mode développement

Pour voir les logs en temps réel pendant le développement :

```bash
make dev
# ou
docker-compose up --build
```

### Accéder aux shells

```bash
make shell-backend    # Shell du backend
make shell-admin      # Shell frontend admin
make shell-client     # Shell frontend client
make shell-db         # MongoDB shell
```

### Sauvegarder les données

```bash
make backup-db
```

Les sauvegardes sont stockées dans `./backups/`

## 🔒 Sécurité (Important !)

Avant de déployer en production :

1. ✅ Changez tous les mots de passe par défaut dans `.env`
2. ✅ Utilisez des secrets forts et aléatoires
3. ✅ Ne commitez JAMAIS le fichier `.env`
4. ✅ Configurez HTTPS
5. ✅ Limitez l'accès aux ports (surtout MongoDB)

## ❓ Besoin d'aide ?

- Consultez les logs : `make logs`
- Vérifiez l'état : `make ps`
- Consultez [DOCKER.md](./DOCKER.md) pour plus de détails

---

**Bonne utilisation ! 🚀**


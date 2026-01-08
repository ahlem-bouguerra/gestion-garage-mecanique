# 🎉 Bienvenue dans votre projet dockerisé !

Votre application **Gestion Garage Mécanique** est maintenant entièrement dockerisée ! 🐳

## 🚀 Démarrage en 3 étapes

### Étape 1️⃣ : Configurer les variables d'environnement

```bash
cp env.example .env
```

Puis éditez le fichier `.env` et changez au minimum :
- `SESSION_SECRET`
- `JWT_SECRET`  
- `MONGO_PASSWORD`

### Étape 2️⃣ : Construire les images

```bash
make build
```

### Étape 3️⃣ : Démarrer l'application

```bash
make up
```

## 🎯 Accéder à l'application

Une fois démarrée, l'application est accessible sur :

| 🖥️ Service | 🔗 URL | 📝 Description |
|-----------|--------|---------------|
| **Interface Admin** | http://localhost:3000 | Interface d'administration |
| **Interface Client** | http://localhost:3001 | Interface pour les clients |
| **API Backend** | http://localhost:5000 | API REST |

## 📚 Documentation disponible

| 📄 Fichier | 📖 Contenu |
|-----------|-----------|
| **QUICKSTART.md** | Guide de démarrage rapide et commandes utiles |
| **DOCKER.md** | Documentation Docker complète et détaillée |
| **DOCKER_SETUP.md** | Récapitulatif technique de la configuration |
| **FICHIERS_DOCKER_CREES.md** | Liste de tous les fichiers créés |

## ⚡ Commandes rapides

```bash
make help          # Voir toutes les commandes disponibles
make up            # Démarrer tous les services
make down          # Arrêter tous les services
make logs          # Voir les logs en temps réel
make restart       # Redémarrer tous les services
make ps            # Voir l'état des conteneurs
make clean         # Nettoyage complet
```

## 🛠️ Commandes de débogage

```bash
make logs-backend      # Logs du backend uniquement
make logs-admin        # Logs frontend admin
make logs-client       # Logs frontend client
make logs-db           # Logs MongoDB

make shell-backend     # Accéder au shell du backend
make shell-admin       # Accéder au shell frontend admin
make shell-client      # Accéder au shell frontend client
make shell-db          # Accéder à MongoDB shell
```

## ✅ Vérifier l'installation

Pour vérifier que tout est correctement configuré :

```bash
./check-docker.sh
```

## 🏗️ Architecture

Votre application est composée de **4 services Docker** :

```
┌─────────────────────┐       ┌─────────────────────┐
│   Frontend Admin    │       │   Frontend Client   │
│    (Next.js)        │       │    (Next.js)        │
│    Port 3000        │       │    Port 3001        │
└──────────┬──────────┘       └──────────┬──────────┘
           │                             │
           └──────────┬──────────────────┘
                      │
           ┌──────────▼──────────┐
           │      Backend        │
           │    (Express.js)     │
           │     Port 5000       │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │      MongoDB        │
           │     Port 27017      │
           │   (Données persist.)│
           └─────────────────────┘
```

## 🔧 Fichiers créés

### Configuration Docker
- ✅ `docker-compose.yml` - Configuration principale
- ✅ `Dockerfile` pour chaque service (Backend, Frontend Admin, Frontend Client)
- ✅ `.dockerignore` pour optimiser les builds

### Scripts utiles
- ✅ `Makefile` - Commandes simplifiées
- ✅ `docker-start.sh` - Script de démarrage
- ✅ `docker-stop.sh` - Script d'arrêt
- ✅ `check-docker.sh` - Vérification environnement

### Documentation
- ✅ `QUICKSTART.md` - Guide rapide
- ✅ `DOCKER.md` - Documentation complète
- ✅ `DOCKER_SETUP.md` - Récapitulatif technique
- ✅ `env.example` - Variables d'environnement

## 📦 Ce qui a été configuré

✅ **4 services Docker** (MongoDB, Backend, 2 Frontends)  
✅ **Réseau isolé** pour la communication entre services  
✅ **Volume persistant** pour les données MongoDB  
✅ **Variables d'environnement** configurables  
✅ **CORS** configuré pour Docker  
✅ **Redémarrage automatique** des services  
✅ **Documentation complète**  
✅ **Scripts pratiques**  

## 🎓 Première utilisation ?

1. **Lisez** le fichier `QUICKSTART.md` pour un guide pas à pas
2. **Exécutez** `./check-docker.sh` pour vérifier votre environnement
3. **Configurez** votre fichier `.env`
4. **Démarrez** avec `make build && make up`
5. **Accédez** à http://localhost:3000 pour l'interface admin

## 🐛 Problèmes ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `make logs`
2. Vérifiez l'état : `make ps`  
3. Exécutez la vérification : `./check-docker.sh`
4. Consultez `QUICKSTART.md` section "Problèmes courants"
5. Nettoyez et recommencez : `make clean && make build && make up`

## 🔒 Important : Sécurité

⚠️ **Avant de déployer en production** :
- Changez TOUS les mots de passe dans `.env`
- Utilisez des secrets forts et aléatoires
- N'exposez pas MongoDB publiquement
- Configurez HTTPS
- Ne committez JAMAIS le fichier `.env`

## 💡 Astuces

### Mode développement avec logs
Pour voir les logs en direct pendant le développement :
```bash
docker-compose up
# ou
make dev
```

### Sauvegarde de la base de données
```bash
make backup-db
```
Les sauvegardes sont dans `./backups/`

### Accéder à la base de données
```bash
make shell-db
```

## 🎉 C'est tout !

Votre environnement est prêt ! Vous pouvez maintenant :

1. **Démarrer** : `make up`
2. **Développer** : Modifiez le code normalement
3. **Tester** : Accédez aux URLs ci-dessus
4. **Arrêter** : `make down` quand vous avez terminé

---

**Besoin d'aide ?** Consultez la documentation dans les fichiers `.md` ! 📚

**Bon développement ! 🚀**


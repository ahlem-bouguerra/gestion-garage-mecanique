# Guide d'accès à la base de données MongoDB

## Informations de connexion

D'après votre `docker-compose.yml`:
- **Host**: `localhost` (ou `mongodb` depuis un conteneur Docker)
- **Port**: `27017`
- **Username**: `admin` (par défaut)
- **Password**: `admin123` (par défaut)
- **Database**: `garage` (ou celle définie dans MONGO_URI)
- **Auth Source**: `admin`

## Méthode 1: MongoDB Compass (Interface Graphique - Recommandé)

### Installation
1. Téléchargez MongoDB Compass depuis: https://www.mongodb.com/try/download/compass
2. Installez l'application

### Connexion
Utilisez cette chaîne de connexion:
```
mongodb://admin:admin123@localhost:27017/garage?authSource=admin
```

Ou connectez-vous avec:
- **Host**: `localhost`
- **Port**: `27017`
- **Username**: `admin`
- **Password**: `admin123`
- **Authentication Database**: `admin`

## Méthode 2: MongoDB Shell (mongosh) - Ligne de commande

### Installation de mongosh
```bash
# Sur Ubuntu/Debian
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-mongosh
```

### Connexion
```bash
mongosh "mongodb://admin:admin123@localhost:27017/garage?authSource=admin"
```

### Commandes utiles dans mongosh
```javascript
// Lister toutes les bases de données
show dbs

// Utiliser la base de données garage
use garage

// Lister toutes les collections
show collections

// Voir les utilisateurs (collection Users)
db.users.find().pretty()

// Voir les garages
db.garages.find().pretty()

// Compter les documents dans une collection
db.users.countDocuments()

// Chercher un utilisateur spécifique
db.users.findOne({ email: "admin@garage.com" })

// Voir les SuperAdmins
db.users.find({ isSuperAdmin: true }).pretty()
```

## Méthode 3: Via Docker Exec (mongosh dans le conteneur)

```bash
# Se connecter au conteneur MongoDB
docker exec -it garage-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# Ou directement avec la base garage
docker exec -it garage-mongodb mongosh "mongodb://admin:admin123@localhost:27017/garage?authSource=admin"
```

## Méthode 4: Mongo Express (Interface Web dans Docker)

Ajoutez ce service à votre `docker-compose.yml`:

```yaml
  mongo-express:
    image: mongo-express:latest
    container_name: garage-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin123
      ME_CONFIG_MONGODB_URL: mongodb://admin:admin123@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    depends_on:
      - mongodb
    networks:
      - garage-network
```

Puis accédez à: http://localhost:8081

## Méthode 5: Script Node.js pour voir les données

Créez un fichier `viewDB.js`:

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Users } from "./models/Users.js";

dotenv.config();

async function viewDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");

    // Voir tous les utilisateurs
    const users = await Users.find();
    console.log("📋 Utilisateurs:", users.length);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - SuperAdmin: ${user.isSuperAdmin}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

viewDatabase();
```

## Collections principales dans la base "garage"

- `users` - Utilisateurs SuperAdmin
- `garages` - Garages
- `garagistes` - Garagistes
- `clients` - Clients
- `vehicules` - Véhicules
- `services` - Services
- `devis` - Devis
- `factures` - Factures
- `ordres` - Ordres de travail
- `reservations` - Réservations
- `roles` - Rôles
- `permissions` - Permissions
- `userroles` - Association utilisateurs-rôles

## Voir les SuperAdmins spécifiquement

Dans mongosh:
```javascript
use garage
db.users.find({ isSuperAdmin: true }).pretty()
```

Ou pour voir seulement les emails:
```javascript
db.users.find({ isSuperAdmin: true }, { email: 1, username: 1, phone: 1 }).pretty()
```

# Utiliser l'image Node.js LTS
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code (inclut le dossier shared si copié localement)
COPY . .

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["node", "server.js"]


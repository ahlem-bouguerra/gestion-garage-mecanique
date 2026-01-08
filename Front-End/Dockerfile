# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm ci

# Copier le reste du code
COPY . .

# Build l'application Next.js
RUN npm run build

# Étape 2 : Production
FROM node:20-alpine

WORKDIR /app

# Variable d'environnement pour Next.js
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Copier les fichiers standalone depuis le builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server.js"]


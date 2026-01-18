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
ENV PORT=3002

# Copier package.json pour installer les dépendances de production
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copier les fichiers build depuis le builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Exposer le port
EXPOSE 3002

# Commande de démarrage
CMD ["npx", "next", "start", "-p", "3002"]

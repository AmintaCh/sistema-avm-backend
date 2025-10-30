# syntax=docker/dockerfile:1

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm AS builder
WORKDIR /app

# Instala toolchain solo para compilar dependencias nativas si es necesario
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Instala dependencias
COPY package*.json ./
RUN npm ci

# Copia el resto del código y construye
COPY . .
RUN npm run build


FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

# Copia el artefacto compilado
COPY --from=builder /app/dist ./dist

# Expone el puerto usado por Nest
EXPOSE 3000

# Inicia la app
CMD ["npm", "run", "start:prod"]


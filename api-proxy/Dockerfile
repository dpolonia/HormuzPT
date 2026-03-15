FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist/ dist/
# Data directory for SQLite history and model state fallback.
# In Cloud Run builds, deploy.sh copies model_state_initial.json here before build.
# In docker-compose, the file is volume-mounted at runtime.
COPY data/ data/
EXPOSE 8081
CMD ["node", "dist/index.js"]

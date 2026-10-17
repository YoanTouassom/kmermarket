FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
# Koyeb injecte PORT automatiquement ; le code lit process.env.PORT.
# Le healthcheck attendu est GET /api/health (voir src/app.js).

EXPOSE 5000

USER node

CMD ["node", "src/server.js"]

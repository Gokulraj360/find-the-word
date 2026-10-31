# Multi-stage Docker build for Cognitor
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

COPY client ./client/
COPY server ./server/
COPY scripts ./scripts/

# Generate prisma client & build client bundle
RUN npx prisma generate
RUN npx vite build client

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json* ./
COPY services/github-bot/package.json ./services/github-bot/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/db
RUN npm run build -w services/github-bot

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/services/github-bot/dist ./services/github-bot/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3002
CMD ["node", "services/github-bot/dist/index.js"]

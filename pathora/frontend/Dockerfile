FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps --no-audit --no-fund

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_GATEWAY
ENV NEXT_PUBLIC_API_GATEWAY=$NEXT_PUBLIC_API_GATEWAY

ARG NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
ENV NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=$NEXT_PUBLIC_REMOTE_IMAGE_HOSTS

ARG NEXT_PUBLIC_IMAGES_UNOPTIMIZED
ENV NEXT_PUBLIC_IMAGES_UNOPTIMIZED=$NEXT_PUBLIC_IMAGES_UNOPTIMIZED

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_API_GATEWAY
ENV NEXT_PUBLIC_API_GATEWAY=${NEXT_PUBLIC_API_GATEWAY}

ARG NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
ENV NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=${NEXT_PUBLIC_REMOTE_IMAGE_HOSTS}

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3003
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3003 || exit 1

CMD ["node", "server.js"]

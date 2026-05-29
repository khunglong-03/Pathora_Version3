# syntax=docker/dockerfile:1.7

FROM node:22.14.0-alpine3.20 AS base
WORKDIR /app

# Stage 1: deps — install node_modules with BuildKit cache
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Stage 2: builder — build Next.js standalone output
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_GATEWAY
ARG NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
ARG NEXT_PUBLIC_IMAGES_UNOPTIMIZED
ARG NEXT_PUBLIC_ENABLE_DEV_LOGGER
ARG DOCKER_BUILD
ARG NODE_OPTIONS_ARG="--max-old-space-size=8192"
ENV NEXT_PUBLIC_API_GATEWAY=$NEXT_PUBLIC_API_GATEWAY \
    NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=$NEXT_PUBLIC_REMOTE_IMAGE_HOSTS \
    NEXT_PUBLIC_IMAGES_UNOPTIMIZED=$NEXT_PUBLIC_IMAGES_UNOPTIMIZED \
    NEXT_PUBLIC_ENABLE_DEV_LOGGER=$NEXT_PUBLIC_ENABLE_DEV_LOGGER \
    DOCKER_BUILD=$DOCKER_BUILD \
    NODE_OPTIONS=$NODE_OPTIONS_ARG \
    NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,id=next,target=/app/.next/cache \
    npm run build

# Stage 3: runner — minimal runtime (no libc6-compat, no extra apk)
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3003 \
    HOSTNAME=0.0.0.0

ARG NEXT_PUBLIC_API_GATEWAY
ARG NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
ARG NEXT_PUBLIC_ENABLE_DEV_LOGGER
ENV NEXT_PUBLIC_API_GATEWAY=${NEXT_PUBLIC_API_GATEWAY} \
    NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=${NEXT_PUBLIC_REMOTE_IMAGE_HOSTS} \
    NEXT_PUBLIC_ENABLE_DEV_LOGGER=${NEXT_PUBLIC_ENABLE_DEV_LOGGER}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3003

# BusyBox wget (built-in on alpine) — no apk add needed
HEALTHCHECK --interval=15s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3003 || exit 1

CMD ["node", "server.js"]

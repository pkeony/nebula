# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
RUN corepack enable pnpm

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM deps AS build

COPY apps/web/ apps/web/

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nebula/web build

# ── Stage 3: Runner ──
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/web/public apps/web/public
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

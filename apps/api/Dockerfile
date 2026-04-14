# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
RUN corepack enable pnpm

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ai/package.json packages/ai/package.json
COPY packages/agent/package.json packages/agent/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/mcp-client/package.json packages/mcp-client/package.json
COPY packages/mcp-server/package.json packages/mcp-server/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM deps AS build

COPY packages/ packages/
COPY apps/api/ apps/api/

RUN pnpm build

# ── Stage 3: Runner ──
FROM node:22-alpine AS runner
RUN corepack enable pnpm

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=deps /app/packages/ai/package.json packages/ai/package.json
COPY --from=deps /app/packages/agent/package.json packages/agent/package.json
COPY --from=deps /app/packages/shared/package.json packages/shared/package.json
COPY --from=deps /app/packages/mcp-client/package.json packages/mcp-client/package.json
COPY --from=deps /app/packages/mcp-server/package.json packages/mcp-server/package.json
COPY --from=deps /app/apps/api/package.json apps/api/package.json

COPY --from=build /app/packages/ai/dist packages/ai/dist
COPY --from=build /app/packages/agent/dist packages/agent/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/mcp-client/dist packages/mcp-client/dist
COPY --from=build /app/packages/mcp-server/dist packages/mcp-server/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/mcp-servers.json apps/api/mcp-servers.json

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]

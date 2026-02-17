FROM oven/bun:1 AS builder
WORKDIR /usr/src/app

COPY package.json bun.lock ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.base.json ./
COPY biome.json ./

RUN bun install --frozen-lockfile
RUN bun run --filter @hidden-gems/api build

FROM oven/bun:1 AS release
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "./apps/api/dist/index.js"]
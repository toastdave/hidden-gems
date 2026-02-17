# Hidden Gems Marketplace

A platform for discovering and sharing hidden local gems -- secret spots, underground events, and unique activities.

## Stack

- **Web**: Astro + React + Tailwind CSS + shadcn/ui
- **API**: Bun + Hono
- **Database**: PostgreSQL (pgvector) + Drizzle ORM
- **Monorepo**: Bun workspaces

## Project Structure

```
apps/
  web/              Astro web frontend
  api/              Hono API server
packages/
  db/               Drizzle ORM schema, migrations, seed
  shared/           Shared TypeScript types
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com/) + Docker Compose

### Install dependencies

```bash
bun install
```

### Local development (Docker Compose)

```bash
docker compose up
```

This starts:
- **Web** at http://localhost:4321
- **API** at http://localhost:3000
- **Postgres** at localhost:5432

Source code is mounted for hot reload. Edit files and see changes immediately.

### Local development (host)

If you prefer running services directly on the host:

```bash
# Start Postgres via Docker
docker compose up postgres

# Run API
cd apps/api && bun run dev

# Run Web
cd apps/web && bun run dev
```

### Database

```bash
# Generate a new migration after schema changes
bun run --filter @hidden-gems/db db:generate

# Apply pending migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hidden_gems \
  bun run --filter @hidden-gems/db db:migrate

# Seed sample data
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hidden_gems \
  bun run --filter @hidden-gems/db db:seed

# Open Drizzle Studio
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hidden_gems \
  bun run --filter @hidden-gems/db db:studio
```

### Migration troubleshooting

- `DATABASE_URL environment variable is required`: export `DATABASE_URL` before `db:migrate` and `db:seed`.
- `connect ECONNREFUSED`: run `docker compose up postgres` and wait for healthcheck success.
- Partial migration failure: fix the latest migration SQL and re-run `db:migrate` (forward-only strategy).
- Duplicate seed records: keep stable seed IDs and unique keys unchanged.

## Quality Checks

Run these before merging any PR:

```bash
bun run lint          # Biome linter
bun run typecheck     # TypeScript checks across all workspaces
bun run test          # Tests across all workspaces
bun run build         # Build all workspaces
```

### Docker Build Verification

Verify production images build correctly:

```bash
docker build -f apps/web/Dockerfile -t hidden-gems-web .
docker build -f apps/api/Dockerfile -t hidden-gems-api .
```

## Runtime Environment Variables

### API

- `DATABASE_URL` (required): Postgres connection string.
- `BETTER_AUTH_SECRET` (required outside local dev): Better Auth signing secret.
- `BETTER_AUTH_URL` (recommended): API origin used by Better Auth.
- `CLIENT_ORIGIN` (recommended): web origin used for OAuth and checkout redirects.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional): Google OAuth provider credentials.
- `POLAR_WEBHOOK_SECRET` (recommended): signature validation for billing webhooks.
- `ADMIN_EMAILS` (optional): comma-separated list of moderation admins.

### Web

- `PUBLIC_API_BASE_URL` (optional): defaults to `http://localhost:3000`.
- `API_INTERNAL_BASE_URL` (optional): SSR-only API base URL (use `http://api:3000` in Docker).

## API Structure

- `apps/api/src/index.ts`: app bootstrap only (middleware, Better Auth mount, route mount, error handler).
- `apps/api/src/middleware/*`: request logging/correlation id, auth session context, auth guards, error handler.
- `apps/api/src/routes/*`: route modules by domain.
- `apps/api/src/controllers/*`: request/response orchestration per domain.
- `apps/api/src/services/*`: domain business logic and DB operations.
- `apps/api/src/utils/*`: shared helpers (auth, listings, billing signature, logging).

## Implemented Feature Surface

- Auth: native Better Auth endpoints under `/api/auth/*` (email/password, session, optional Google OAuth).
- Hosts: host profile create/upsert and public host page.
- Listings: draft create/update, publish, visibility filtering, feed and map APIs.
- Engagement: favorites toggle/list.
- Alerts: saved alerts create/list/toggle and worker skeleton route.
- Billing: plans, checkout URL creation, webhook processing, entitlement status, premium gate endpoint.
- Trust & Safety: listing reporting and admin moderation endpoints/pages.

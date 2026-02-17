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

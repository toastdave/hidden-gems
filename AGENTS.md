# AGENTS.md
Guidance for agentic coding assistants in this repository.
User instructions take priority over this file.

## Repo Summary
- Bun workspace monorepo.
- `apps/web`: Astro + React + Tailwind.
- `apps/api`: Bun + Hono.
- `packages/db`: Drizzle schema/migrations/seed.
- `packages/shared`: shared TypeScript types.
- Tooling: Biome, TypeScript strict mode, Bun test.

## Cursor and Copilot Rules
- Checked `.cursor/rules/`: not present.
- Checked `.cursorrules`: not present.
- Checked `.github/copilot-instructions.md`: not present.
- If later added, treat them as high-priority instructions.

## Setup
- Requires Bun >= 1.x.
- Install dependencies:
```bash
bun install
```
- Optional local stack:
```bash
docker compose up
```

## Core Commands (from repo root)
```bash
# dev/build/lint/typecheck/test for all workspaces
bun run dev
bun run build
bun run lint
bun run lint:fix
bun run typecheck
bun run test
```

## Workspace Commands
```bash
# API
bun run --filter @hidden-gems/api dev
bun run --filter @hidden-gems/api build
bun run --filter @hidden-gems/api typecheck
bun run --filter @hidden-gems/api test

# Web
bun run --filter @hidden-gems/web dev
bun run --filter @hidden-gems/web build
bun run --filter @hidden-gems/web typecheck

# DB
bun run --filter @hidden-gems/db db:generate
bun run --filter @hidden-gems/db db:migrate
bun run --filter @hidden-gems/db db:seed
bun run --filter @hidden-gems/db db:studio

# Docker helpers
bun run db:migrate:docker
bun run db:seed:docker
```

## Running a Single Test
- API tests are in `apps/api/src/**/*.test.ts`.
- Run one file from root:
```bash
bun test apps/api/src/routes/protected-routes.test.ts
```
- Run one file from `apps/api`:
```bash
bun test src/routes/protected-routes.test.ts
```
- Run one test case by name:
```bash
bun test src/routes/protected-routes.test.ts -t "anonymous host create fails with 401"
```
- API test script defaults `DATABASE_URL` to local Postgres if unset.
- If DB connection fails:
```bash
docker compose up postgres
```

## Formatting and Imports
- Biome config (`biome.json`) is authoritative.
- 2-space indent, line width 100.
- JS/TS: double quotes and semicolons.
- Use Biome-organized imports; do not hand-maintain order.
- Avoid unused imports and variables.
- `.astro` files have relaxed unused rules in repo config.

## TypeScript Guidelines
- Keep strict typing; avoid `any`.
- Use `unknown` at boundaries and narrow explicitly.
- For request JSON, existing pattern is `Record<string, unknown>` then parse/validate.
- Reuse types from `@hidden-gems/shared` where possible.
- Keep domain types explicit; avoid vague object shapes.

## Naming Conventions
- Files: kebab-case in API/domain layers.
- Functions/variables: `camelCase`.
- Components/interfaces/types: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- API handlers: suffix `Handler`.
- Route registries: `<domain>Routes`.

## Architecture Rules
- Maintain layering: routes -> controllers -> services -> db/utils.
- Controllers own HTTP concerns:
  - auth checks,
  - request parsing,
  - status/response mapping.
- Services own business logic + data access.
- Keep shared helpers in `utils` and shared contracts in `packages/shared`.

## Error Handling
- Expected failures return structured errors (commonly `{ error, status }`).
- Use 4xx for validation/auth/ownership failures.
- Do not throw for normal validation flow.
- Throw only for unexpected failures; let global error middleware handle 500.
- Validate coordinates/ranges and auth ownership early.

## Logging
- Preserve `x-request-id` correlation behavior.
- Use existing JSON logger utility.
- Include request context (method/path/status/duration/correlationId).
- Never log secrets or credentials.

## Frontend Conventions
- Match existing Astro + React + Tailwind patterns.
- Reuse `apps/web/src/components/ui/*` components first.
- Use `cn()` utility for class composition.
- Keep Astro server/client boundaries clear (`client:*` only where needed).
- Reuse `apps/web/src/lib/api.ts` fetch helpers.

## Agent Checklist Before Finish
```bash
bun run lint
bun run typecheck
bun run test
bun run build
```
- For API-only changes: run targeted API tests plus API typecheck at minimum.
- For DB schema changes: include migrations and verify migrate/seed flow.

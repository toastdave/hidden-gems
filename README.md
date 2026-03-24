# Hidden Gems

Hidden Gems is a location-first discovery platform for yard sales, estate sales, flea markets, and pop-up vendor events.

## Locked stack

- `SvelteKit` + `Svelte 5`
- `Tailwind CSS v4`
- `shadcn-svelte`
- `mapcn-svelte`
- `Drizzle ORM`
- `Postgres`
- `Better Auth`
- `Polar`
- `Bun workspaces`
- `Biome`
- `Docker Compose`
- `mise`

## Workspace layout

- `apps/web` - buyer and host-facing SvelteKit app
- `packages/db` - Drizzle schema, migrations, and seeding
- `docs/prds` - epic PRDs and implementation task breakdowns
- `apps/web/Dockerfile` - container image for dev and production SSR

## Quick start

1. `cp .env.example .env`
2. `mise install`
3. `mise run install`
4. `mise run docker:up`
5. `mise run db:push`
6. `mise run seed`
7. `mise run dev`

To run the full app stack inside Docker with hot reload, use `mise run dev:docker`.

## Auth setup

- Email/password auth uses `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
- `BETTER_AUTH_TRUSTED_ORIGINS` accepts a comma-separated list of extra origins, including your Tailscale URL.
- GitHub OAuth callback: `http://localhost:7411/api/auth/callback/github`
- Google OAuth callback: `http://localhost:7411/api/auth/callback/google`
- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` to enable those buttons.

## Tailscale serve

1. Start the app with the repo env loaded so `DATABASE_URL` and auth settings are available.
2. Run `tailscale serve --bg --https=443 http://127.0.0.1:7411`.
3. Set `BETTER_AUTH_URL=https://<device>.<tailnet>.ts.net` if you want Better Auth links and OAuth callbacks to resolve to your tailnet hostname.
4. Add that same origin to `BETTER_AUTH_TRUSTED_ORIGINS` when you want to use both localhost and Tailscale during development.

## Core commands

- `mise run dev` - run the SvelteKit app locally with Bun
- `mise run lint` - run Biome linting
- `mise run format` - format the repo with Biome
- `mise run check` - run Svelte and TypeScript checks
- `mise run test` - run Bun tests
- `mise run build` - produce the SSR build
- `mise run db:generate` - generate Drizzle migrations
- `mise run db:migrate` - apply migrations
- `mise run db:studio` - open Drizzle Studio

## Notes

- We are intentionally starting with a `SvelteKit` monolith instead of a separate API service.
- `svelte-adapter-bun` is used for Bun-native SSR output.
- `Biome` replaces both Prettier and ESLint for the initial codebase.

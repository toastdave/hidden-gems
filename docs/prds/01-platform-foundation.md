# Platform Foundation

## Goal

Create the technical and design foundation for a fast-moving SvelteKit monolith with Bun workspaces, Drizzle, containers, and a reusable UI system.

## MVP scope

- Monorepo structure with `apps/web` and `packages/db`
- Bun-native SSR output, local Docker services, detached full-stack Docker dev, and mise task runners
- Environment handling, database schema ownership, local seeding, and optional Tailscale preview access
- Shared visual tokens, app shell, navigation skeleton, and route organization

## Requirements

- Local, full Docker, and tailnet preview setups work from a fresh clone with documented commands.
- Core environments exist for local, preview, and production.
- The app has a consistent shell for public, auth, and host areas.
- Database changes are versioned and repeatable.

## Task breakdown

- Create workspace, package management, and repository conventions.
- Set up Biome, TypeScript checks, and baseline test entrypoints.
- Containerize Postgres, object storage, mail testing, and SSR app runtime.
- Build route groups and placeholder layouts for public, account, and host areas.
- Add seed scripts, fake data fixtures, reset instructions, and remote-preview runbooks.
- Define environment variables for auth, billing, storage, and maps.
- Add CI-ready commands for install, check, lint, test, and build.

## Acceptance criteria

- A new developer can start the app locally in under 15 minutes.
- The app builds with the chosen Bun SSR adapter.
- Database schema, seed data, local services, and remote preview run without manual patching.

## Non-goals

- Production infra provisioning
- Advanced feature flags or experimentation systems

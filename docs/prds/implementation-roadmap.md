# Implementation Roadmap

## Phase 1 - Foundation

- Finalize repository conventions, environments, local containers, and CI entrypoints.
- Establish Drizzle schema ownership, migrations, seeds, and workspace task runners.
- Ship the SvelteKit shell, app layout, route groups, and design tokens.

## Phase 2 - Host publishing core

- Implement authentication, sessions, and account settings.
- Ship host profile creation and host dashboard scaffolding.
- Build listing draft, edit, publish, and lifecycle management flows.
- Add media upload, ordering, and cover image handling.

## Phase 3 - Discovery MVP

- Launch the home feed, listing detail pages, host pages, and map-first browsing.
- Add location search, date filters, event-type filters, and tag filters.
- Add SEO, structured metadata, and mobile-first performance work.

## Phase 4 - Engagement and retention

- Add favorites, follows, and saved search alerts.
- Add notification preferences and transactional messaging.
- Add host and listing activity surfaces that reinforce repeat usage.

## Phase 5 - Monetization and trust

- Launch Polar checkout, entitlements, and premium feature gates.
- Add reporting, moderation queues, and basic abuse tooling.
- Add operational dashboards, error tracking, audit trails, and launch analytics.

## Cross-cutting launch checklist

- Every core route works on mobile and desktop.
- Core actions have empty, loading, success, and error states.
- Seed data supports realistic local discovery demos.
- Billing, auth, and upload secrets are separated by environment.
- Moderation and error logging exist before public launch.

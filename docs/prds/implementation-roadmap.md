# Implementation Roadmap

## Phase 1 - Foundation

- Finalize repository conventions, environments, local containers, tailnet preview flow, and CI entrypoints.
- Establish Drizzle schema ownership, migrations, seeds, and workspace task runners.
- Ship the SvelteKit shell, shadcn-svelte design foundations, mapcn-svelte map foundations, and route groups.

Status: complete for the current MVP foundation.

## Phase 2 - Host publishing core

- Implement authentication, sessions, and account settings.
- Ship host profile creation and host dashboard scaffolding.
- Build listing draft, edit, publish, and lifecycle management flows with mobile-friendly shadcn-svelte surfaces.
- Add media upload, ordering, and cover image handling.

Status: mostly complete. Authentication, host onboarding, host dashboard, listing creation/edit/publish, public host pages, and image upload/remove/cover flows are live. Remaining work is listing lifecycle polish, host profile editing, and richer media management.

## Phase 3 - Discovery MVP

- Launch the discovery-first homepage, listing detail pages, host pages, and map-first browsing.
- Add location search, date filters, event-type filters, and tag filters.
- Add SEO, structured metadata, and mobile-first performance work.

Status: in progress. The homepage, listing detail pages, host pages, DB-backed discovery, real MapTiler-backed geocoding/location search, host-side address geocoding, sharable date/type/radius/tag filters, richer location autocomplete, homepage discovery media thumbnails, and public-page SEO metadata are live. Remaining work centers on performance polish and deeper date-based discovery controls.

## Phase 4 - Engagement and retention

- Add favorites, follows, and saved search alerts.
- Add notification preferences and transactional messaging.
- Add host and listing activity surfaces that reinforce repeat usage.

Status: next priority after discovery and publishing polish.

## Phase 5 - Monetization and trust

- Launch Polar checkout, entitlements, and premium feature gates.
- Validate upgrade checkout and entitlement sync in Polar sandbox before enabling live billing.
- Add reporting, moderation queues, and basic abuse tooling.
- Add operational dashboards, error tracking, audit trails, and launch analytics.

Status: not started.

## Cross-cutting launch checklist

- Every core route works on mobile and desktop.
- Core actions have empty, loading, success, and error states.
- Seed data supports realistic local discovery demos.
- Billing, auth, and upload secrets are separated by environment.
- Billing environments are explicit: local app development, Polar sandbox, then live production.
- Moderation and error logging exist before public launch.

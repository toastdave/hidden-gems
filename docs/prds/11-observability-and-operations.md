# Observability And Operations

## Goal

Ensure the MVP can be operated, debugged, and improved after launch without guessing blindly.

## MVP scope

- Structured logs and error tracking boundaries
- Basic product analytics for core funnel events
- Audit logs for billing and moderation changes
- Operational runbooks for local and launch workflows

## Requirements

- The team can trace failures in auth, billing, uploads, and discovery.
- Key activation metrics are measurable from the start.
- Local and preview environments stay aligned enough to debug issues safely.

## Task breakdown

- Define a shared event taxonomy for auth, publish, favorite, follow, alert, and upgrade events.
- Add request logging and route-level error capture.
- Add analytics hooks for discovery views and host conversion actions.
- Persist billing and moderation audit events.
- Create runbooks for migrations, seeding, Docker lifecycle, Tailscale Serve setup, storage setup, and webhook replay.
- Add health checks for SSR app, Postgres, and object storage.

## Acceptance criteria

- Critical actions emit inspectable logs or analytics events.
- Operators can trace billing and moderation mutations.
- Launch checklist includes backup, rollback, incident contacts, and local/remote debugging steps.

## Non-goals

- Full data warehouse pipelines
- Advanced APM before first launch

# Listings Creation And Management

## Goal

Let hosts create, update, publish, unpublish, and manage event listings with minimal friction.

## MVP scope

- Draft and publish flow for one-off local events
- Event title, description, date, time, address, tags, and listing type
- Listing lifecycle states and host dashboard management views
- Preview-friendly editing experience with autosave or clear save states

## User stories

- As a host, I can publish a yard sale quickly from my phone.
- As a host, I can update my event details if plans change.
- As a host, I can unpublish or archive an old event.
- As a host, I can manage listings from a polished mobile-friendly dashboard that does not feel like an internal tool.

## Task breakdown

- Build dashboard list view with status tabs for draft, published, and archived.
- Create listing form sections for basics, schedule, location, tags, and photos using shadcn-svelte form primitives.
- Add validation for required fields and publish readiness.
- Add listing preview and detail page parity checks.
- Support publish, unpublish, duplicate, archive, and delete behaviors.
- Add server-side permissions so hosts only manage their own listings.
- Store structured location data to support mapcn-svelte map views and radius search.

## Current implementation status

- Completed: draft and publish flow, edit flow, dashboard entrypoints, status-filtered dashboard views, location/tag validation, server-side ownership checks, public listing detail pages, and lifecycle actions for duplicate, move-to-draft, cancel, archive, and delete.
- In progress: closer preview/detail parity and any dedicated preview surface work.
- Not started: a dedicated preview surface.

## Shipped notes

- Hosts can now duplicate an existing listing into a new draft that carries over structured details and tags for faster repeat publishing.
- Hosts can now move listings back to draft, mark them cancelled, archive older events, or delete them from the editor.
- The host dashboard now supports status filters for all, published, draft, archived, and cancelled listings.

## Acceptance criteria

- Hosts can create a draft and publish it from the dashboard.
- Listings render correctly on public detail pages after publication.
- Archived or cancelled listings stop appearing in active discovery feeds.

## Non-goals

- Recurring event series
- In-app transactions or checkout

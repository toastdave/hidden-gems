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

## Task breakdown

- Build dashboard list view with status tabs for draft, published, and archived.
- Create listing form sections for basics, schedule, location, tags, and photos.
- Add validation for required fields and publish readiness.
- Add listing preview and detail page parity checks.
- Support publish, unpublish, duplicate, archive, and delete behaviors.
- Add server-side permissions so hosts only manage their own listings.
- Store structured location data to support map and radius search.

## Acceptance criteria

- Hosts can create a draft and publish it from the dashboard.
- Listings render correctly on public detail pages after publication.
- Archived or cancelled listings stop appearing in active discovery feeds.

## Non-goals

- Recurring event series
- In-app transactions or checkout

# Discovery And Search

## Goal

Make it easy for buyers to find worthwhile local events fast, especially on Friday and Saturday mobile visits.

## MVP scope

- Home feed with nearby and upcoming listings
- Map browsing with listing markers and lightweight popovers
- Filters for distance, date, type, and tags
- Listing detail and host detail pages with strong SEO metadata

## Requirements

- Discovery must feel local, visual, and calm instead of chaotic.
- The app should support a map-heavy workflow without blocking a list-first fallback.
- Location search must work even when browser geolocation is denied.

## Task breakdown

- Build home feed sections for nearby, this weekend, and featured listings.
- Add map view with marker clustering and card sync behavior.
- Implement location search, browser geolocation, and radius filtering.
- Add date, type, and tag filters with sharable URL state.
- Build listing detail pages with image gallery, schedule, and host attribution.
- Add host profile links and related listings modules.
- Add empty states, no-results states, and fallback prompts for location access.

## Acceptance criteria

- A user can search by location and refine results without signing in.
- Map and list views reflect the same query state.
- Listing detail pages are crawlable and render with meaningful metadata.

## Non-goals

- Full-text search infrastructure beyond what Postgres can support initially
- Route optimization or trip planning

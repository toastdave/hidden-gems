# Discovery And Search

## Goal

Make it easy for buyers to find worthwhile local events fast, especially on Friday and Saturday mobile visits.

## MVP scope

- Home feed with nearby and upcoming listings
- Map browsing with listing markers and lightweight popovers built with mapcn-svelte
- Filters for distance, date, type, and tags
- Listing detail and host detail pages with strong SEO metadata

## Requirements

- Discovery must feel local, visual, and calm instead of chaotic.
- The app should support a map-heavy workflow without blocking a list-first fallback.
- Location search must work even when browser geolocation is denied.
- The homepage should be a real discovery surface, not a marketing or scaffold page.
- Discovery UI should use shadcn-svelte primitives and only introduce custom UI where it materially improves product quality.

## Task breakdown

- Build the homepage as a discovery-first surface with nearby, this weekend, and featured listings.
- Add a mapcn-svelte map view with marker clustering and card sync behavior.
- Implement location search, browser geolocation, and radius filtering.
- Add date, type, and tag filters with sharable URL state.
- Build listing detail pages with image gallery, schedule, and host attribution.
- Add host profile links and related listings modules.
- Add empty states, no-results states, and fallback prompts for location access.
- Remove internal-tech messaging from discovery surfaces.

## Acceptance criteria

- A user can search by location and refine results without signing in.
- Map and list views reflect the same query state.
- Listing detail pages are crawlable and render with meaningful metadata.

## Non-goals

- Full-text search infrastructure beyond what Postgres can support initially
- Route optimization or trip planning

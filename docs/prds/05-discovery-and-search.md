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

## Current implementation status

- Completed: discovery-first homepage, DB-backed published listings, map/list sync, sharable date/type/radius/tag filtering, deeper date filters for today/tomorrow/this weekend/next 7 days, listing detail pages, host detail pages, homepage discovery media thumbnails, product-facing discovery copy, MapTiler-backed location geocoding, richer location autocomplete suggestions, public-page canonical/open graph metadata, and browser geolocation fallback messaging.
- In progress: stronger performance/code-splitting polish, with the homepage map surface now lazy-loaded after the first paint.
- Not started: saved search alerts tied to geocoded locations.

## Implementation notes

- Discovery location search now supports typed place lookups via a server-side MapTiler geocoding adapter, keeping API keys off the client.
- Discovery location search now also exposes lightweight server-backed autocomplete suggestions so people can lock in a neighborhood or ZIP code before submitting a full search.
- Shared URL state now carries searched `place`, `lat`, and `lng` values so radius and type filters stay in sync after geocoding.
- Shared URL state now carries a dedicated `tag` filter alongside date, type, radius, and location state so discovery routes stay linkable and bookmarkable.
- Date filters now ship as sharable homepage state with `today`, `tomorrow`, `this weekend`, and `next 7 days` presets, plus contextual counts to help people plan ahead without opening each listing.
- Homepage discovery cards and the selected map stop now surface listing cover media when hosts have uploaded photos, while keeping the existing branded fallback for image-light listings.
- Homepage, listing, and host detail pages now ship canonical URLs plus richer open graph and Twitter metadata, with JSON-LD on public listing and host pages to strengthen organic discovery.
- The homepage now defers the heavy interactive map bundle until after the initial route shell renders, keeping list/search content visible while the map hydrates.
- Browser geolocation still remains optional; when denied, the UI should steer people back toward manual place search without blocking discovery.
- Host listing save flows geocode structured addresses automatically and still allow optional coordinate overrides when the pin needs manual correction.

## Acceptance criteria

- A user can search by location and refine results without signing in.
- Map and list views reflect the same query state.
- Listing detail pages are crawlable and render with meaningful metadata.

## Non-goals

- Full-text search infrastructure beyond what Postgres can support initially
- Route optimization or trip planning

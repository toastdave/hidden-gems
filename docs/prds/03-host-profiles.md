# Host Profiles

## Goal

Give sellers and organizers a trustworthy public identity that ties listings together and makes repeat discovery easier.

## MVP scope

- One primary host profile per user account
- Host slug, display name, bio, avatar, and location label
- Public host page with active and upcoming listings
- Follow action entrypoints for signed-in users

## Requirements

- Host creation is simple enough for an individual weekend seller.
- Public host pages feel more trustworthy than anonymous classifieds.
- Hosts can update profile details without touching listing content.
- Host onboarding and public profile UI should be built from shadcn-svelte primitives unless a custom surface is clearly warranted.

## Task breakdown

- Create host onboarding flow after account creation.
- Build host edit form with slug validation and preview states.
- Create public host profile page with header, bio, and listing grid.
- Use shared shadcn-svelte cards, forms, and status patterns for host surfaces.
- Add host status indicators such as verified, featured, or new.
- Add ownership checks and permissions for host editing.
- Expose host summary cards in listing and search results.

## Current implementation status

- Completed: one-host-per-user onboarding, slug validation, public host pages, host dashboard access, host profile editing, host links from discovery and listing surfaces, and follow actions on public host and listing pages.
- In progress: richer host trust states and stronger host activity surfaces.
- Not started: richer buyer-facing host affinity surfaces beyond the base follow action.

## Shipped notes

- Hosts now have a dedicated profile edit route so they can update their public identity without touching listing content.
- The dashboard now links directly into host profile management alongside listing creation and public profile review.

## Acceptance criteria

- A signed-in user can create a host profile in one guided flow.
- A public host page loads with active listings and basic metadata.
- Invalid or duplicate slugs are handled gracefully.

## Non-goals

- Multi-user team management
- Complex organizer CRM features

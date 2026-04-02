# Engagement

## Goal

Increase repeat visits by letting users save interesting listings and follow hosts they trust.

## MVP scope

- Favorite a listing from discovery cards and listing detail pages
- Follow a host from host pages and listing detail pages
- Saved listings and followed hosts views in the account area
- Signed-in prompts and optimistic interaction states on public surfaces
- Leave host-visible counts and activity surfaces for a later follow-up

## Requirements

- Engagement actions must feel fast, reversible, and lightweight on mobile.
- Saved views should live in the account area first, with clear separation between listings and hosts.
- Unauthenticated users should see a clean sign-in prompt that returns them to the same listing or host surface.
- The data model should be structured so it can power saved search alerts and notifications later.
- Buyer retention loops come before host-facing vanity metrics.

## User stories

- As a buyer, I can save listings so I remember where I want to go.
- As a buyer, I can follow hosts whose events I want to monitor.
- As a buyer, I can revisit my saved listings and followed hosts from my account without re-running searches.
- As a host, I benefit when users build repeat affinity around my profile.

## Current implementation status

- Completed: auth, account entrypoints, public listing pages, public host pages, discovery surfaces, listing favorites on discovery cards and listing detail pages, host follows on host and listing pages, and saved listings/followed hosts account views.
- In progress: engagement analytics hooks and any follow-on activity surfaces for hosts or listings.
- Not started: host-facing counts, richer activity modules, and saved search alerts.

## Recommended implementation sequence

1. Add analytics and persistence patterns that can support alerts later.
2. Layer in host and listing activity surfaces once engagement events are trustworthy.
3. Reuse the same saved-state patterns for notification preferences and saved search alerts.

## Task breakdown

- Add favorite toggle on listing cards and detail pages.
- Add follow toggle on host pages and listing detail pages.
- Build saved listings and followed hosts views in the account area.
- Add optimistic UI and signed-in gating patterns.
- Record analytics for save and follow events.
- Add limits or premium checks only if monetization requires them.

## Implementation notes

- This should be the next feature slice after discovery because it extends the current browse flow into a repeat-visit loop without introducing delivery infrastructure yet.
- Keep the first saved experience account-first; homepage or discovery-surface saved modules can follow once the baseline account views are stable.
- Store enough context on favorites and follows to support future notification preferences and saved search alerts in `08-alerts-and-notifications.md`.
- Delay host-visible counts, activity feeds, and social proof modules until the underlying engagement events are trustworthy.

## Acceptance criteria

- Signed-in users can save and unsave listings without page refreshes.
- Signed-in users can follow and unfollow hosts.
- Saved listings and followed hosts appear in account views and survive new sessions.
- Unauthenticated users who try to save or follow are routed through sign-in without losing their place.

## Shipped notes

- Discovery cards now expose a save action without interrupting the existing map/list browsing flow.
- Listing detail pages now support both save-listing and follow-host entrypoints.
- Host profiles now expose the follow action directly in the page header.
- The account area now separates saved listings from followed hosts so the first retention loop has a dedicated home.

## Open questions

- Should saved content stay account-only until alerts ship, or also surface on the discovery homepage?
- Should engagement actions remain fully free in MVP, or leave room for later limits under billing?
- Do host-visible counts belong in the next slice, or only after notification and alerts work lands?

## Non-goals

- Social feeds
- Public comments or reviews
- Saved search alerts in the first engagement slice

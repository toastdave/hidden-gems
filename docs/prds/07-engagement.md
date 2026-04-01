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

- Completed: auth, account entrypoints, public listing pages, public host pages, and discovery surfaces are live, so the main prerequisites for engagement exist.
- In progress: none yet inside the engagement epic itself.
- Not started: listing favorites, host follows, saved account views, and engagement analytics hooks.

## Recommended implementation sequence

1. Add favorite toggles to listing cards and listing detail pages.
2. Add follow toggles to host pages and host entrypoints on listing detail pages.
3. Build saved listings and followed hosts views in the account area.
4. Add analytics and persistence patterns that can support alerts later.

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

## Open questions

- Is the immediate KPI repeat buyer visits or host listing quality?
- Should saved content stay account-only for MVP, or also appear on the discovery homepage?
- Should engagement actions remain fully free in MVP, or leave room for later limits under billing?
- Do host-visible counts belong in this phase, or only after notification and alerts work lands?

## Non-goals

- Social feeds
- Public comments or reviews
- Saved search alerts in the first engagement slice

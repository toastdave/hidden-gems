# Alerts And Notifications

## Goal

Help users come back when new events match their interests and geography.

## MVP scope

- Saved search alerts by location, distance, type, and tags
- Email-first notification delivery
- In-app notification records for future expansion
- Alert management in account settings

## Requirements

- Alerts are understandable and editable.
- Delivery volume is constrained enough to avoid spammy behavior.
- Notifications respect account preferences and entitlement limits.

## Current implementation status

- Completed: discovery filters already carry structured location, radius, date, type, and tag state that can seed future alert rules; the engagement MVP now provides saved-state patterns in account surfaces; users can save the current discovery search into account-managed saved searches; account-level alert preferences now control enabled state and cadence; and delivery runs can create in-app notification records plus per-listing delivery history.
- In progress: delivery is working through a manual run boundary and in-app notifications, while email sending and preference expansion are still pending.
- Not started: email delivery, notification history beyond in-app plus delivery-log records, and richer preference surfaces.

## Task breakdown

- Build saved search creation flow from discovery filters.
- Persist alert criteria in structured form for re-querying.
- Create a matching job or scheduled task boundary for future automation.
- Add email template placeholders and local mail testing through Mailpit.
- Build notification preference settings and alert management UI.
- Store sent notification history for debugging and throttling.

## Implementation notes

- Sequence this after the engagement MVP in `07-engagement.md` so account saved-state patterns and notification preference modeling have a cleaner foundation.
- Reuse the current discovery filter contract so alerts mirror the same location, radius, type, and tag behavior users already understand.
- Keep the initial delivery model simple with email-first sends and persisted records that can support retries or future in-app inbox views.
- The current shipped slice saves searches into account, lets users pause or delete them, stores a simple cadence preference, and delivers fresh matches into account notifications through a manual run boundary while email remains a follow-up.

## Acceptance criteria

- Users can create, edit, pause, and delete saved alerts.
- Alert rules reflect current discovery filter logic.
- Notification records are persisted even if sending retries later.

## Shipped notes

- Discovery now includes a save-search entrypoint that turns the current location, radius, type, and tag mix into a saved search.
- Account now shows saved searches separately from saved listings and followed hosts.
- Saved searches can currently be paused, resumed, and deleted before delivery automation is introduced.
- Alert preferences now let users enable or pause saved-search delivery globally and choose between instant and daily cadence.
- Delivery runs now create in-app alert notifications and per-listing delivery records so the same listing is not re-sent for the same saved search.

## Non-goals

- Push notifications at initial launch
- Complex frequency tuning beyond a simple cadence option

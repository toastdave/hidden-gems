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

- Completed: discovery filters already carry structured location, radius, date, type, and tag state that can seed future alert rules.
- In progress: none yet inside the alerts epic itself.
- Not started: saved alert creation, notification preferences, delivery jobs, and notification history.

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

## Acceptance criteria

- Users can create, edit, pause, and delete saved alerts.
- Alert rules reflect current discovery filter logic.
- Notification records are persisted even if sending retries later.

## Non-goals

- Push notifications at initial launch
- Complex frequency tuning beyond a simple cadence option

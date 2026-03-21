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

## Task breakdown

- Build saved search creation flow from discovery filters.
- Persist alert criteria in structured form for re-querying.
- Create a matching job or scheduled task boundary for future automation.
- Add email template placeholders and local mail testing through Mailpit.
- Build notification preference settings and alert management UI.
- Store sent notification history for debugging and throttling.

## Acceptance criteria

- Users can create, edit, pause, and delete saved alerts.
- Alert rules reflect current discovery filter logic.
- Notification records are persisted even if sending retries later.

## Non-goals

- Push notifications at initial launch
- Complex frequency tuning beyond a simple cadence option

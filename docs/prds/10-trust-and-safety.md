# Trust And Safety

## Goal

Provide lightweight moderation and reporting tools so discovery feels credible and abuse is manageable.

## MVP scope

- Report listing and report host actions
- Basic moderation queue
- Listing visibility controls for unsafe or spammy content
- Audit trail for moderation actions

## Requirements

- Reporting is easy for legitimate users and hard to abuse at scale.
- Moderation actions are attributable and reversible where practical.
- Unsafe content can be hidden quickly without data loss.

## Task breakdown

- Add report entrypoints to listings and host pages.
- Build report submission form with reason taxonomy and freeform detail.
- Store moderation status, notes, and timestamps.
- Add internal review screens for open and actioned reports.
- Support hide, unpublish, and dismiss workflows.
- Add rate limiting or friction controls around repeated abuse reports.

## Acceptance criteria

- Users can submit reports against listings and hosts.
- Report records show clear status transitions.
- Moderation actions affect public visibility as intended.

## Non-goals

- Fully automated moderation scoring
- End-user dispute resolution tooling

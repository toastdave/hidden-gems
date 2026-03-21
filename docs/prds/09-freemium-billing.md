# Freemium Billing

## Goal

Monetize premium host capabilities without becoming a marketplace for physical goods.

## MVP scope

- Free and premium plan definitions
- Polar checkout entrypoints
- Webhook processing for subscription lifecycle updates
- Entitlement checks for listing limits, photo limits, and featured visibility

## Requirements

- Billing stays focused on software subscription access.
- Entitlements are source-of-truth in the app database.
- Hosts understand what upgrades unlock before checkout.

## Task breakdown

- Define free and premium feature limits in the plan model.
- Build upgrade UI, billing settings page, and checkout CTA placement.
- Integrate Polar customer portal and checkout sessions.
- Receive and persist webhook events with idempotent processing.
- Sync subscription state into app entitlements.
- Gate premium-only creation limits, featured options, and alert caps.
- Add downgrade-safe behavior when plans expire or lapse.

## Acceptance criteria

- A host can complete checkout and receive upgraded entitlements.
- Premium-only limits are enforced server-side.
- Webhook replays do not duplicate entitlement state.

## Non-goals

- Payment flow for physical event purchases
- Custom enterprise billing

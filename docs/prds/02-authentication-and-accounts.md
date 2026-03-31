# Authentication And Accounts

## Goal

Enable secure sign-up, sign-in, session handling, and account settings for hosts and buyers.

## MVP scope

- Email and password authentication through Better Auth
- Session persistence and protected routes
- Basic account settings for display name, avatar, and notification preferences
- Upgrade-safe account model for future social login

## User stories

- As a buyer, I can create an account so I can save listings and follows.
- As a host, I can sign in and manage my event listings.
- As a returning user, I stay signed in on my own device.

## Task breakdown

- Add Better Auth server integration and environment wiring.
- Create auth routes for sign-up, sign-in, sign-out, and password reset placeholders.
- Add protected layout handling for dashboard and account routes.
- Persist sessions in Postgres using Drizzle-managed tables.
- Build account settings page and profile update form.
- Add email verification hooks, even if sending stays behind a feature flag initially.
- Add audit-friendly logging for auth failures and account lifecycle events.

## Current implementation status

- Completed: Better Auth integration, protected routes, session persistence, sign-up/sign-in/sign-out flows, and a basic account area that links into host onboarding.
- In progress: account settings remain lightweight and do not yet support profile editing or notification preferences.
- Not started: password reset, email verification delivery, and audit-friendly auth logging.

## Acceptance criteria

- Protected routes redirect anonymous users.
- Signed-in users can reach account settings and sign out cleanly.
- Auth tables and session records are queryable in Drizzle Studio.

## Non-goals

- Full multi-factor authentication
- Social login on day one

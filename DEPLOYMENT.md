# Deployment and Operations Guide

## Railway Service Mapping

- Railway project: `hidden-gems` (single project, multi-service).
- Service `web`:
  - Root directory: `apps/web`
  - Build command: `bun run build`
  - Start command: `bun run preview --host 0.0.0.0 --port $PORT`
- Service `api`:
  - Root directory: `apps/api`
  - Build command: `bun run build`
  - Start command: `bun run dist/index.js`
- Branch mapping:
  - `main` -> production
  - feature branches -> preview environments (enabled via Railway GitHub integration)

## Environment Contract

### API required

- `DATABASE_URL`
- `AUTH_SECRET`

### API integrations

- `CLIENT_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `POLAR_WEBHOOK_SECRET`
- `ADMIN_EMAILS`

### Web required

- `PUBLIC_API_BASE_URL`

## Release Verification Checklist

Run after every deployment:

1. Web reachability:
   - Load `/` and `/auth` from deployed web URL.
2. API health and DB:
   - GET `/health` returns `{ status: "ok", database: true }`.
3. Auth smoke:
   - Create test account via `/api/auth/sign-up/email` and verify `/api/auth/get-session` returns user.
4. Listings smoke:
   - Create draft and publish listing with authenticated test account.
   - Verify listing appears in `/listings/feed`.
5. Billing webhook reachability:
   - POST test payload to `/billing/webhook`.
6. Moderation permissions:
   - Non-admin denied for `/admin/reports`.
   - Admin account can load report list.

## Rollback Procedure

1. Identify failed release:
   - Compare deployment timestamp and `x-request-id` traces from API logs.
2. Roll back service:
   - Use Railway deployment history and redeploy previous successful build for impacted service.
3. Validate rollback:
   - Re-run release verification checklist.
4. Post-incident follow-up:
   - Capture root cause, blast radius, and remediation tasks.
   - Add missing detection (healthcheck, alert, or log field) before next release.

## Incident Triage Notes

- Use request correlation IDs (`x-request-id`) from client or logs.
- API logs include request start/completion and error entries as JSON.
- For auth/billing incidents, inspect cookie signing secret and webhook signature configuration first.

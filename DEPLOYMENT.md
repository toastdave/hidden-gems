# Deployment Guide

Hidden Gems uses [Railway](https://railway.app) for deployment via its native GitHub integration.

## Railway Setup

### GitHub Integration

1. Connect the GitHub repository to a Railway project
2. Configure branch-to-environment mapping:
   - `main` branch deploys to **production**
   - Feature branches can use Railway preview environments

### Service Configuration

#### Web Service

| Setting       | Value                          |
|---------------|--------------------------------|
| Root directory| `apps/web`                     |
| Build command | `bun install && bun run build` |
| Start command | `node ./dist/server/entry.mjs` |
| Port          | `4321`                         |

Environment variables:
- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT=4321`

#### API Service

| Setting       | Value                          |
|---------------|--------------------------------|
| Root directory| `apps/api`                     |
| Build command | `bun install`                  |
| Start command | `bun run src/index.ts`         |
| Port          | `3000`                         |

Environment variables:
- `NODE_ENV=production`
- `DATABASE_URL` (provided by Railway Postgres plugin)

#### Postgres

Provision via Railway's built-in PostgreSQL plugin. The `DATABASE_URL` is automatically injected into linked services.

## Pre-Merge Checklist

Before promoting code to a deployment branch:

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] `bun run build` succeeds
- [ ] Docker images build locally (see README)

## Post-Deploy Verification

After each Railway deployment:

1. **Web reachability**: Visit the deployed web URL and confirm the page loads
2. **API health**: `curl https://<api-domain>/health` returns `{"status":"ok"}`
3. **Database connectivity**: The `/health` endpoint succeeding implies DB connection (once wired)
4. **Smoke test**: Verify core user flows (browse listings, view detail page)

## Rollback

If a deployment fails verification:

1. Open the Railway dashboard for the affected service
2. Click the previous successful deployment
3. Select **Redeploy** to roll back
4. Investigate the failing deployment logs before re-attempting

Railway keeps deployment history, so rollbacks are instant re-deploys of a prior build.

## Troubleshooting

| Symptom                        | Likely Cause                        | Fix                                      |
|--------------------------------|-------------------------------------|------------------------------------------|
| Web returns 502                | Build failed or port mismatch       | Check Railway build logs, verify PORT env |
| API /health returns error      | Missing DATABASE_URL                | Link Postgres plugin to API service       |
| Migrations not applied         | Migrations not run post-deploy      | Add migrate step to build command or run manually |
| Workspace deps not found       | Root directory too narrow            | Ensure Railway root dir is correct        |

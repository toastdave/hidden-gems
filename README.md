# Hidden Gems

Hidden Gems is a location-first discovery platform for yard sales, estate sales, flea markets, and pop-up vendor events.

## Requirements

- `mise`
- `Docker` with `docker compose`
- `Tailscale` for tailnet access

## Getting started

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Update `.env` for your machine:

```dotenv
BETTER_AUTH_URL=https://<device>.<tailnet>.ts.net:1101
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:1101,https://<device>.<tailnet>.ts.net:1101
```

3. Install the toolchain and dependencies:

```bash
mise install
mise run install
```

4. Choose a development workflow:

- `mise run dev` for the web app on your host machine with Docker-managed support services
- `mise run dev:docker` for the entire stack in Docker with hot reload

## Local development

Run the supporting services in Docker and the web app on your host machine.

Start:

```bash
mise run docker:up
mise run db:push
mise run seed
mise run dev
```

`mise run db:push` may prompt before applying schema changes. Accept the prompt, then run `mise run seed`.

App URLs:

- Web app: `http://localhost:1101`
- Mailpit: `http://localhost:1104`
- MinIO console: `http://localhost:1106`

Stop supporting services:

```bash
mise run docker:down
```

Reset local infrastructure data:

```bash
docker compose down -v
```

The app supports hot reload in this mode. Leave the Docker services running while you edit files locally.

Run a saved-search delivery pass locally:

```bash
bun run alerts:deliver
```

This checks active saved searches, creates any new in-app alert notifications, and is useful while Mailpit/email delivery is still being phased in.

## Full Docker development

Run the entire app stack inside Docker with hot reload.

Start:

```bash
mise run dev:docker
```

This task runs detached. Follow the app logs with:

```bash
docker compose logs -f web
```

In another shell, initialize the database if needed:

```bash
mise run db:push
mise run seed
```

`mise run db:push` may prompt before applying schema changes. Accept the prompt, then run `mise run seed`.

Open:

- Web app: `http://localhost:1101`
- Mailpit: `http://localhost:1104`
- MinIO console: `http://localhost:1106`

Stop:

```bash
mise run docker:down
```

Reset all Docker data:

```bash
docker compose down -v
```

The stack is safe to leave running during development. Code changes are picked up by the containerized Vite dev server.

## Tailscale access

Expose the web app to your tailnet after either local or full Docker development is running.

This repo uses the same port locally and over Tailscale so multiple projects can share one tailnet node without colliding on `443`.

Start Tailscale Serve:

```bash
mise run tailscale:up
```

Check status:

```bash
mise run tailscale:status
```

Stop serving over Tailscale:

```bash
mise run tailscale:down
```

Open the app from another device on your tailnet:

```text
https://<device>.<tailnet>.ts.net:1101
```

Use the full `https://` URL. This setup serves HTTPS on port `1101`; `http://` requests to the tailnet hostname will fail.

## Billing setup

- `POLAR_ACCESS_TOKEN` is used for Polar API access.
- `POLAR_WEBHOOK_SECRET` validates webhook deliveries.
- `POLAR_SERVER` should remain `sandbox` until subscription upgrade flows and entitlement syncing are verified end-to-end.

## Billing environments

- Local app development: use seeded plans and entitlement stubs to exercise upgrade UI and gated states.
- Polar sandbox: use `https://sandbox.polar.sh/start` for fake-money checkout and `https://sandbox-api.polar.sh` for API calls.
- Production Polar: enable only after sandbox checkout, webhook replay handling, and entitlement sync are verified.

Sandbox notes:

- Polar sandbox is a separate environment, not a production test-mode toggle.
- Sandbox uses separate accounts, organizations, and tokens.
- Stripe test cards work in Polar sandbox, for example `4242 4242 4242 4242` with a future expiry and any CVC.

## Common commands

```bash
mise run check
mise run lint
mise run test
mise run build
mise run db:generate
mise run db:migrate
mise run db:studio
```

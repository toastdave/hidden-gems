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
BETTER_AUTH_URL=https://<device>.<tailnet>.ts.net
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:7411,https://<device>.<tailnet>.ts.net
```

3. Install the toolchain and dependencies:

```bash
mise install
mise run install
```

## Local development

Run the supporting services in Docker and the web app on your host machine.

Start:

```bash
mise run docker:up
mise run db:push
mise run seed
mise run dev
```

App URLs:

- Web app: `http://localhost:7411`
- Mailpit: `http://localhost:8025`
- MinIO console: `http://localhost:9001`

Stop supporting services:

```bash
mise run docker:down
```

Reset local infrastructure data:

```bash
docker compose down -v
```

## Full Docker development

Run the entire app stack inside Docker with hot reload.

Start:

```bash
mise run dev:docker
```

In another shell, initialize the database if needed:

```bash
mise run db:push
mise run seed
```

Open:

- Web app: `http://localhost:7411`
- Mailpit: `http://localhost:8025`
- MinIO console: `http://localhost:9001`

Stop:

```bash
docker compose down
```

Reset all Docker data:

```bash
docker compose down -v
```

## Tailscale access

Expose the web app to your tailnet after either local or full Docker development is running.

Start Tailscale Serve:

```bash
sudo tailscale serve --bg --https=443 http://127.0.0.1:7411
```

Check status:

```bash
tailscale serve status
```

Stop serving over Tailscale:

```bash
sudo tailscale serve reset
```

Open the app from another device on your tailnet:

```text
https://<device>.<tailnet>.ts.net
```

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

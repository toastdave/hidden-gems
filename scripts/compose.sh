#!/usr/bin/env bash

set -euo pipefail

if docker compose version >/dev/null 2>&1; then
	exec docker compose "$@"
fi

docker_exe="/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe"

if [ -x "$docker_exe" ]; then
	exec "$docker_exe" compose "$@"
fi

if command -v docker-compose >/dev/null 2>&1; then
	exec docker-compose "$@"
fi

printf '%s\n' 'Docker Compose is not available. Install Docker Compose or enable Docker Desktop WSL integration.' >&2
exit 1

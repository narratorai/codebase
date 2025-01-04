#! /usr/bin/env bash
set -Eeuo pipefail

# Start graph server locally
echo "Starting local graph server"
set +x

# shellcheck disable=SC2086
docker compose ${COMPOSE_OPTIONS-} up --build "$@"

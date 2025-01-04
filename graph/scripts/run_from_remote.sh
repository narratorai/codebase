#! /usr/bin/env bash
set -Eeuo pipefail

# Clones data from a deployed graph and runs locally

FROM=${1:-nonprod}

is_healthy() {
    service="$1"
    container_id="$(docker compose ps -q "$service")"
    engine_status="$(docker inspect -f "{{.State.Running}}" "$container_id")"
    health_status="$(docker inspect -f "{{.State.Health.Status}}" "$container_id")"

    if [ "$engine_status" = "true" ] && [ "$health_status" = "healthy" ]; then
        sleep 2
        echo "$service Ready"
        return 0
    else
        echo "Waiting for $service"
        return 1
    fi
}

echo "Running local with data from $FROM graph"
echo "You must be on the Corp VPN for this to work 😅"

HASURA_GRAPHQL_DATABASE_URL=$(scripts/get_db_url.sh "$FROM")

# Stop if running already
docker compose --no-ansi down --remove-orphans --volumes

if [ ! -f .tmp/dbexport.sql ]; then
    # Dump data so that postgres will reload it
    echo "Dumping data from $FROM to load locally"
    mkdir -p .tmp
    pg_dump --no-owner --no-privileges "$HASURA_GRAPHQL_DATABASE_URL" > .tmp/dbexport.sql
else
    echo "SQL dump found at .tmp/dbexport.sql -- skipping pg_dump"
    echo "Delete this file if you want to refresh locally"
fi

# Start locally
COMPOSE_OPTIONS="--no-ansi -f docker-compose.yaml -f docker-compose.restore.yaml" scripts/run_local.sh -d --remove-orphans

while ! is_healthy postgres; do sleep 3; done
while ! is_healthy graphql-engine; do sleep 3; done

# Run migrations against local DB
scripts/run_migrations.sh local

echo "Ready...graphql-engine running on port 8080"
echo "Run \`yarn hasura console\` to open up a console"
echo "Run \`docker compose logs -f\` to tail local server logs"
echo "Run \`docker compose down\` when you are done to stop"

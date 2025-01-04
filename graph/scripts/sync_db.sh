#! /usr/bin/env bash
set -Eeuo pipefail

# Syncs data from one graph db to another, see .pgsync.yml for config!

FROM=${1:-production}
TO=${2:-local}

# TODO parameterize companies
# NOTE adding narrator-demo is problematic b/c of users and foreign keys
# COMPANIES=${COMPANIES:-"narrator, narratorclient, narrator-demo"}

echo "Syncing graph db from $FROM to $TO"
echo "You must be on the Corp VPN for this to work 👻"

if [[ $TO == "production" ]]
then
  echo "This script can't be used to sync TO production!!!"
  exit 1
fi

if [[ $TO == "local" && -n ${INIT:-""} ]]
then
  echo "Initializing local instance"
  docker-compose down --volumes --remove-orphans
  ./scripts/run_local.sh --detach

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
  while ! is_healthy postgres; do sleep 3; done
  while ! is_healthy graphql-engine; do sleep 3; done
fi

./scripts/run_migrations.sh "$TO"

# Sync all the tables that are not in pgsync.yml exclude
# This is enum tables, tables that dont have company specific rows, etc
FROM=$FROM TO=$TO pgsync --fail-fast --disable-user-triggers --overwrite

# Sync company groups
# This will sync company-specific rows by company slug
# TODO parameterize the slugs!
# NOTE for a prod->nonprod sync that is being finicky due to constraints:
# - --disable-integrity is important for users who have records (datsets, etc), but no longer exist. pgsync only syncs users who are currently members of the company being synced
# - try replacing --preserve with --truncate for a run to wipe all rows in nonprod before copying
# - append a --debug here to see more verbose output
FROM=$FROM TO=$TO pgsync company:narratorclient,company:narrator --fail-fast --disable-user-triggers --overwrite --preserve --disable-integrity

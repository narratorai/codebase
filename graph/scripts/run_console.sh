#! /usr/bin/env bash
set -Eeuo pipefail

STAGE=${1:-development}

if [ "$STAGE" = "development" ]; then
  echo "Starting local console"
  yarn hasura console
elif [ "$STAGE" = "production" ]; then
  GRAPH_ENDPOINT="https://graph.us.narrator.ai"

  echo "DO NOT MAKE SCHEMA CHANGES AGAINST A REMOTE GRAPH -- RUN LOCAL AND OPEN A PR WITH YOUR MIGRATIONS"
  echo "Starting console for $GRAPH_ENDPOINT"

  # shellcheck disable=SC2016
  GRAPH_ENDPOINT=$GRAPH_ENDPOINT doppler run \
    -c production \
    --command  'yarn hasura console --endpoint "$GRAPH_ENDPOINT" --admin-secret "$HASURA_GRAPHQL_ADMIN_SECRET"'
else
  echo "Invalid stage. Supported stages are: development, production."
  exit 1
fi

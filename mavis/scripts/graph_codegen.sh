#! /usr/bin/env bash
set -Eeuo pipefail

STAGE=${1:-nonprod}

# Show error message if one of these variables is not set
if [ -z "$AUTH0_CLIENT_ID" ] || [ -z "$AUTH0_CLIENT_SECRET" ] || [ -z "$AUTH0_AUDIENCE" ] || [ -z "$AUTH0_DOMAIN" ]; then
  echo "run with doppler run -- ./scripts/graph_codegen.sh"
  exit 1
fi

echo "Getting an auth0 token for $STAGE"
# Get an access token, it uses doppler auth0 secrets
# shellcheck disable=SC2086
TOKEN=$(curl -X POST -H "Content-Type: application/json" \
  -d '{
    "client_id": "'$AUTH0_CLIENT_ID'",
    "client_secret": "'$AUTH0_CLIENT_SECRET'",
    "audience": "'$AUTH0_AUDIENCE'",
    "grant_type": "client_credentials"
  }' \
  "https://$AUTH0_DOMAIN/oauth/token" | jq -r '.access_token')


echo "Running graph codegen for $STAGE"
# Delete the dest folder if exists
rm -rf core/graph/sync_client

# TOKEN=$(doppler secrets get HASURA_GRAPHQL_ADMIN_SECRET -p graph -c $STAGE --json | jq -r .HASURA_GRAPHQL_ADMIN_SECRET.computed)
GRAPH_TOKEN="Bearer $TOKEN" python -m ariadne_codegen

echo "Running pre-commit hooks"
pre-commit run --color=always --all-files

#! /usr/bin/env bash

set -Eeuo pipefail

FROM=${1:-nonprod}

echo "Syncing data from Heroku PROD to $FROM graph"
echo "You must be on the MGMT VPN for this to work 😅"

DB_SECRET_ID=$(aws cloudformation describe-stacks \
  --stack-name "hasura-$FROM-service" \
  --query "Stacks[0].Outputs[?OutputKey=='DbSecret'].OutputValue" \
  --output text)

# Dump and restore from Rails (public schema) to Hasura DBs (rails_sync schema)
pg_dump --clean --if-exists --no-owner --no-acl \
    -t companies \
    -t users \
    -t companies_users \
    "$(heroku config:get --app api-narrator-prod DATABASE_URL)" > rails_dump.sql

sed -i "" "s/public/rails_sync/g" rails_dump.sql
sed -i "" "s/rails_sync.gen_random_uuid()/public.gen_random_uuid()/g" rails_dump.sql

# Same as the docker entrypoint: parse and format HASURA_GRAPHQL_DATABASE_URL
SECRETS_MANAGER_DATABASE_CREDENTIALS=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ID" --query "SecretString" --output text)
DB_ENGINE=$(echo "$SECRETS_MANAGER_DATABASE_CREDENTIALS" | jq -r .engine)
DB_USER=$(echo "$SECRETS_MANAGER_DATABASE_CREDENTIALS" | jq -r .username)
DB_HOST=$(echo "$SECRETS_MANAGER_DATABASE_CREDENTIALS" | jq -r .host)
# URL encode the password in case it has special characters
DB_PASSWORD=$(echo "$SECRETS_MANAGER_DATABASE_CREDENTIALS" | jq -r .password | jq -Rr @uri)
DB_PORT=$(echo "$SECRETS_MANAGER_DATABASE_CREDENTIALS" | jq -r .port)
DB_TABLE=${HASURA_TABLE:=postgres}
HASURA_GRAPHQL_DATABASE_URL="$DB_ENGINE://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_TABLE"

# Create a rails_sync schema and restore the dump into it
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -c 'CREATE SCHEMA IF NOT EXISTS rails_sync;'
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -f rails_dump.sql

# Migrate + Copy from rails_sync to public schema in Hasura DB
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -f scripts/1-sync-companies.sql
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -f scripts/2-sync-users.sql
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -f scripts/3-sync-company-users.sql

# Drop rails_sync schema in Hasura DB
psql -v ON_ERROR_STOP=1 -d "$HASURA_GRAPHQL_DATABASE_URL" -c 'DROP SCHEMA rails_sync CASCADE;'

# Delete local SQL sync files
rm -rf rails_dump.sql

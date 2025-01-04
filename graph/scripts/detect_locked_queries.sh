#! /usr/bin/env bash
set -Eeuo pipefail

# -- Check for queries that have been running for over 5 minutes
IDLE_QUERY_BODY=$(cat <<-END
  {
    "type": "run_sql",
    "args": {
        "source": "default",
        "sql": "SELECT pid, user, pg_stat_activity.query_start, now() - pg_stat_activity.query_start AS query_time, query, state, wait_event_type, wait_event FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
    }
  }
END
)

IDLE_QUERY_RESULT=$(curl --fail --silent -X POST "${GRAPH_ENDPOINT}/v2/query" \
   -H "Content-Type: application/json" \
   -H "X-Hasura-Admin-Secret: ${ADMIN_SECRET}" \
   -d "${IDLE_QUERY_BODY}")

# Always gets at least one row (headers), more than 1 row indicated blocked queries
IDLE_QUERIES=$(echo "${IDLE_QUERY_RESULT}" | jq '.result | select((. | length) > 1)')
IDLE_QUERY_LENGTH=$(($(echo "${IDLE_QUERIES}" | jq -r '. | length' ) - 1))

if (( IDLE_QUERY_LENGTH >= 1 )); then
  # TODO investiagate what's making these queries
  echo "Decected queries that have been running/idle for over 5 minutes."
  echo "These cause migrations to hang and may deadlock the db, bringing graph down:"
  echo "${IDLE_QUERIES}" | jq .
  echo ""
  echo "HALTING: Please kill these queries with pg_cancel_backend(pid) or pg_terminate_backend(pid), or wait for them to clear up on their own before proceeding with migrations"
  exit 1
fi

exit 0

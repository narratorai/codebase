#! /usr/bin/env bash
set -Eeuo pipefail

echo "Running migrations locally"
yarn hasura metadata apply --skip-update-check
yarn hasura migrate apply --skip-update-check --all-databases
yarn hasura metadata reload --skip-update-check
exit 0

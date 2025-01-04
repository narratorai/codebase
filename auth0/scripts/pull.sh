#!/usr/bin/env bash

set -Eeuo pipefail

STAGE=${1:-nonprod}

echo "Pulling ${STAGE} auth0 config to ./imported/${STAGE}"
echo " - This directory is git ignored, please make changes in the config directory"
echo " - Import strips out client secrets, please check your diffs carefully"
echo ""

doppler run --project auth0 --config "${STAGE}" -- yarn --silent a0deploy export \
  --format directory \
  --output_folder "./imported/${STAGE}" \

yarn --silent prettier --loglevel silent --write "./imported/${STAGE}"
#! /usr/bin/env bash

# doppler setup --no-interactive --project portal --config preview

yarn --silent narrator-graph-codegen --root portal

echo "Copying the-sequel monaco workers to public/.monaco"
cp ./node_modules/@narratorai/the-sequel/dist/json.worker.js ./public/.monaco/json.worker.js
cp ./node_modules/@narratorai/the-sequel/dist/editor.worker.js ./public/.monaco/editor.worker.js

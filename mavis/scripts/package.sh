#! /usr/bin/env bash
set -e

CFN_ARTIFACT_BUCKET=${CFN_ARTIFACT_BUCKET:-narrator-cfn}
SERVICE_NAME=${SERVICE_NAME:-mavis}

# TODO package lambdas better
cd lambda_scripts && \
  zip -q -9 -r --filesync -J -X --exclude=*.zip* --exclude=*.DS_Store* --exclude=*.git* index.zip . && \
  echo "packaged lambdas" && \
  zipinfo index.zip && \
  cd -

aws cloudformation package --template-file stack.yml --s3-bucket "$CFN_ARTIFACT_BUCKET" --s3-prefix "$SERVICE_NAME" --output-template-file stack.packaged.yml

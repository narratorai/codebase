#! /usr/bin/env bash
set -e

SERVICE_NAME=${SERVICE_NAME:-mavis}
JOB_IMAGE_TAG=${JOB_IMAGE_TAG:-master}

# NOTE to deploy from a branch other than master, pass a JOB_IMAGE_TAG env variable
echo Deploying "$SERVICE_NAME":"$JOB_IMAGE_TAG"

scripts/package.sh

aws cloudformation deploy \
  --template-file stack.packaged.yml \
  --stack-name "$SERVICE_NAME" \
  --parameter-overrides JobImageTag="$JOB_IMAGE_TAG" \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags service=mavis VantaOwner=ahmed@narrator.ai VantaNonProd=false VantaContainsUserData=true VantaUserDataStored="Processes and accesses customer data warehouses and cached data" VantaDescription="Narrator data processing"
